/* Copyright (C) 2016 NooBaa */
'use strict';

const _ = require('lodash');
const dbg = require('../../../util/debug_module')(__filename);
const S3Error = require('../s3_errors').S3Error;
const s3_utils = require('../s3_utils');

/**
 * http://docs.aws.amazon.com/AmazonS3/latest/API/mpUploadListMPUpload.html
 */
async function get_bucket_uploads(req) {

    const max_keys_received = Number(req.query['max-uploads'] || 1000);
    if (!Number.isInteger(max_keys_received) || max_keys_received < 0) {
        dbg.warn('Invalid max-uploads', req.query['max-uploads']);
        throw new S3Error(S3Error.InvalidArgument);
    }

    const reply = await req.object_sdk.list_uploads({
        bucket: req.params.bucket,
        prefix: req.query.prefix,
        delimiter: req.query.delimiter,
        key_marker: req.query['key-marker'],
        upload_id_marker: req.query['key-marker'] && req.query['upload-id-marker'],
        limit: Math.min(max_keys_received, 1000),
    });

    const encoding_type = req.query['encoding-type'];
    const encoding_flag = s3_utils.check_encoding_type(encoding_type);
    const encode_field = encoding_flag ? s3_utils.encode_url_field : s3_utils.no_encode;

    return {
        ListMultipartUploadsResult: [{
            'Bucket': req.params.bucket,
            'Prefix': encode_field(req.query.prefix),
            'Delimiter': encode_field(req.query.delimiter),
            'MaxUploads': max_keys_received,
            'KeyMarker': encode_field(req.query['key-marker']),
            'UploadIdMarker': req.query['upload-id-marker'],
            'IsTruncated': reply.is_truncated,
            'NextKeyMarker': encode_field(reply.next_marker),
            'NextUploadIdMarker': reply.next_upload_id_marker,
            'EncodingType': encoding_type,
        },
        _.map(reply.objects, obj => ({
            Upload: {
                Key: encode_field(obj.key),
                UploadId: obj.obj_id,
                Initiated: s3_utils.format_s3_xml_date(obj.upload_started),
                Initiator: s3_utils.DEFAULT_S3_USER,
                Owner: s3_utils.DEFAULT_S3_USER,
                StorageClass: s3_utils.STORAGE_CLASS_STANDARD,
            }
        })),
        _.map(reply.common_prefixes, prefix => ({
            CommonPrefixes: {
                Prefix: encode_field(prefix) || ''
            }
        }))
        ]
    };
}

module.exports = {
    handler: get_bucket_uploads,
    body: {
        type: 'empty',
    },
    reply: {
        type: 'xml',
    },
};
