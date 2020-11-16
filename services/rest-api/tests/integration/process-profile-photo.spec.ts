import { AWS_REGION, lambdaConfig, s3Config } from '@svc/config';
import { handler } from '@svc/handlers/s3/process-profile-photo';
import S3 from 'aws-sdk/clients/s3';
import { readFileSync } from 'fs';
import path from 'path';
import { clearAllObjects } from 'aws-testing-library/lib/utils/s3';
import uuid from '@svc/lib/uuid';
import { LambdaFunctionHandlerInvoker } from '@tests/utils/handler-invokers/lambda-function-handler-invoker';
import { deleteClub, getClub, putClub } from '@svc/lib/repos/clubs-repo';
import { getS3Event } from '@tests/utils/lambda-payload-generator';
import { Club, ClubVisibility } from '@svc/lib/types/sports-club-manager';

const lambdaFunctionName = `${lambdaConfig.functionNamePrefix}s3ProcessProfilePhoto`;
const s3Client = new S3({ region: AWS_REGION });
const lambdaInvoker = new LambdaFunctionHandlerInvoker({
  awsRegion: AWS_REGION,
  lambdaFunctionName,
  handler,
});
const TEST_CLUBID_PREFIX = 'processProfilePhotoTest'; // used to easily identify S3 objects for cleanup

const getClubId = (suffix: string) => `${TEST_CLUBID_PREFIX}_${suffix}`;
const readTestFile = (filename: string) => readFileSync(path.join(__dirname, `../test-data/${filename}`));

const createdClubs: Club[] = [];

const createTestClub = async (clubIdSuffix: string) => {
  const clubId = getClubId(clubIdSuffix);
  const club: Club = {
    id: clubId,
    name: `name${clubId}`,
    sport: 'Soccer',
    visibility: ClubVisibility.PRIVATE,
    managerId: '123456789',
  };
  await putClub(club);
  createdClubs.push(club);
  return club;
};
const deleteTestClubs = async () => {
  await Promise.all(createdClubs.map((async c => deleteClub(c.id))));
  createdClubs.length = 0;
};

const uploadPhotoForClub = async (clubId: string) => {
  const filename = 'profilepic1.png';
  const file = readTestFile(filename);
  const key = `${s3Config.profilePhotosBucketPrefix}${clubId}.png`;
  await s3Client.putObject({
    Key: key,
    Bucket: s3Config.mediaBucket,
    Body: file,
  }).promise();
  return key;
};

const cleanupS3 = async () => {
  // Use a prefix here to ensure we only delete the S3 objects that we created as part of this test run.
  await clearAllObjects(
    AWS_REGION, s3Config.mediaBucket, `${s3Config.profilePhotosBucketPrefix}${TEST_CLUBID_PREFIX}`,
  );
};

describe('`s3ProcessProfilePhoto` Lambda function', () => {
  jest.setTimeout(30000);

  beforeAll(async () => {
    // Clear existing objects just in case the afterAll from previous test run didn't execute ok.
    await cleanupS3();
  });

  it('is triggered whenever file is uploaded to S3 [e2e]', async () => {
    const clubId = getClubId(`${uuid()}_Club1`); // this needs to be unique for every test run

    // ACT: upload file to S3 using the clubId as the filename
    await uploadPhotoForClub(clubId);

    // ASSERT: check CloudWatch logs to verify function invoked
    const expectedLog = clubId;
    await expect({
      region: AWS_REGION,
      function: `${lambdaConfig.functionNamePrefix}s3ProcessProfilePhoto`,
      timeout: 20000,
    }).toHaveLog(expectedLog);
  });

  it('updates `profilePhoto` field in Club record in DDB', async () => {
    // ARRANGE: create test Club in DDB
    const testClub = await createTestClub('Club2');

    const objectKey = `${s3Config.profilePhotosBucketPrefix}${testClub.id}.png`;

    // ACT: invoke func passing in an S3 event payload
    const event = getS3Event(s3Config.mediaBucket, objectKey, AWS_REGION, 'ObjectCreated:Put');
    await lambdaInvoker.invoke(event);

    // ASSERT: fetch back Club from DDB to verify its field has been updated ok
    const savedClub = await getClub(testClub.id);
    expect(savedClub?.profilePhotoUrlPath).toEqual(objectKey);
  });

  afterAll(async () => {
    await Promise.all([
      cleanupS3(),
      deleteTestClubs(),
    ]);
  });
});
