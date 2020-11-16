import { S3Handler } from 'aws-lambda';
import log from '@dazn/lambda-powertools-logger';
import { extname } from 'path';
import { setClubProfilePhotoPath } from '@svc/lib/repos/clubs-repo';
import { s3Config } from '@svc/config';

/**
 * Strip folder path and file extension in order to get path
 * @param objectKey
 */
const getClubIdFromObjectKey = (objectKey: string) => objectKey
  .replace(s3Config.profilePhotosBucketPrefix, '')
  .replace(extname(objectKey), '');

/**
 * Handler for S3:ObjectCreated:* events underneath clubprofiles prefix.
 */
export const handler: S3Handler = async (event) => {
  log.debug('Received S3 event', { event });
  const objectKey = event.Records[0].s3.object.key;
  const clubId = getClubIdFromObjectKey(objectKey);
  try {
    await setClubProfilePhotoPath(clubId, objectKey);
    log.info('Completed setClubProfilePhotoPath.', { clubId, objectKey });
  } catch (error) {
    log.error('Error with setClubProfilePhotoPath ', { clubId, objectKey }, error);
    throw error;
  }
};
