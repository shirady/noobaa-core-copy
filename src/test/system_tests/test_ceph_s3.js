/* Copyright (C) 2016 NooBaa */
"use strict";


const fs = require('fs');
const argv = require('minimist')(process.argv);
const dbg = require('../../util/debug_module')(__filename);
if (argv.log_file) {
    dbg.set_log_to_file(argv.log_file);
}
dbg.set_process_name('test_ceph_s3');

const _ = require('lodash');
const P = require('../../util/promise');
const os_utils = require('../../util/os_utils');

require('../../util/dotenv').load();

const {
    pass = 'DeMo1',
    protocol = 'ws',
    mgmt_ip = 'localhost',
    mgmt_port = '8080',
    s3_ip = 'localhost',
    s3_acc_key = 123,
    s3_sec_key = 'abc',
} = argv;

let {
    email = 'demo@noobaa.com',
    system_name = 'demo',
} = argv;

const api = require('../../api');
const rpc = api.new_rpc();

const client = rpc.new_client({
    address: `${protocol}://${mgmt_ip}:${mgmt_port}`
});

// if (process.platform !== 'darwin') {
//     email = 'admin@noobaa.io';
//     system_name = 'noobaa';
// }

const auth_params = { email, password: `${pass}`, system: `${system_name}` };

const CEPH_TEST = {
    test_dir: 'src/test/system_tests/',
    s3_test_dir: 's3-tests/',
    ceph_config: 'ceph_s3_config.conf',
    ceph_deploy: 'ceph_s3_tests_deploy.sh',
    pool: 'test-pool',
    new_account_params: {
        name: 'cephalt',
        email: 'ceph.alt@noobaa.com',
        //password: 'ceph',
        has_login: false,
        s3_access: true,
    },
    new_account_params_tenant: {
        name: 'cephtenant',
        email: 'ceph.tenant@noobaa.com',
        //password: 'ceph',
        has_login: false,
        s3_access: true,
    }
};

let stats = {
    pass: [],
    fail: [],
    skip: [],
    total: 0
};

let tests_list;

const s3_tests_black_list_url = 'src/test/system_tests/s3-tests/s3_tests_black_list.txt';
const S3_CEPH_TEST_BLACKLIST = fs.readFileSync(s3_tests_black_list_url).toString().trim().split("\n");
const s3_tests_pending_list_url = 'src/test/system_tests/s3-tests/s3_tests_pending_list.txt';
const S3_CEPH_TEST_PENDING_LIST = fs.readFileSync(s3_tests_pending_list_url).toString().trim().split("\n");
const S3_CEPH_TEST_OUT_OF_SCOPE = S3_CEPH_TEST_BLACKLIST.concat(S3_CEPH_TEST_PENDING_LIST);
//Regexp match will be tested per each entry
const S3_CEPH_TEST_OUT_OF_SCOPE_REGEXP = new RegExp(`(${S3_CEPH_TEST_OUT_OF_SCOPE.join(')|(')})`);
const S3_CEPH_TEST_STEMS = [
    's3tests.functional.test_headers.',
    's3tests.functional.test_s3.',
    's3tests.fuzz.test.test_fuzzer.',
    's3tests.functional.test_s3_website.',
    's3tests.tests.test_realistic.',
    's3tests_boto3.functional.test_headers.',
    's3tests_boto3.functional.test_s3.',
    's3tests_boto3.fuzz.test.test_fuzzer.',
    's3tests_boto3.functional.test_s3_website.',
    's3tests_boto3.tests.test_realistic.',
];
const S3_CEPH_TEST_SIGV4 = [
    'check_can_test_multiregion',
    'test_bucket_create_bad_amz_date_after_today_aws4',
    'test_bucket_create_bad_amz_date_before_epoch_aws4',
    'test_bucket_create_bad_amz_date_before_today_aws4',
    'test_bucket_create_bad_amz_date_empty_aws4',
    'test_bucket_create_bad_amz_date_invalid_aws4',
    'test_bucket_create_bad_amz_date_none_aws4',
    'test_bucket_create_bad_amz_date_unreadable_aws4',
    'test_bucket_create_bad_authorization_invalid_aws4',
    'test_bucket_create_bad_date_after_today_aws4',
    'test_bucket_create_bad_date_before_epoch_aws4',
    'test_bucket_create_bad_date_before_today_aws4',
    'test_bucket_create_bad_date_empty_aws4',
    'test_bucket_create_bad_date_invalid_aws4',
    'test_bucket_create_bad_date_none_aws4',
    'test_bucket_create_bad_date_unreadable_aws4',
    'test_bucket_create_bad_ua_empty_aws4',
    'test_bucket_create_bad_ua_none_aws4',
    'test_bucket_create_bad_ua_unreadable_aws4',
    'test_object_create_bad_amz_date_after_end_aws4',
    'test_object_create_bad_amz_date_after_today_aws4',
    'test_object_create_bad_amz_date_before_epoch_aws4',
    'test_object_create_bad_amz_date_before_today_aws4',
    'test_object_create_bad_amz_date_empty_aws4',
    'test_object_create_bad_amz_date_invalid_aws4',
    'test_object_create_bad_amz_date_none_aws4',
    'test_object_create_bad_amz_date_unreadable_aws4',
    'test_object_create_bad_authorization_incorrect_aws4',
    'test_object_create_bad_authorization_invalid_aws4',
    'test_object_create_bad_contentlength_mismatch_below_aws4',
    'test_object_create_bad_date_after_end_aws4',
    'test_object_create_bad_date_after_today_aws4',
    'test_object_create_bad_date_before_epoch_aws4',
    'test_object_create_bad_date_before_today_aws4',
    'test_object_create_bad_date_empty_aws4',
    'test_object_create_bad_date_invalid_aws4',
    'test_object_create_bad_date_none_aws4',
    'test_object_create_bad_date_unreadable_aws4',
    'test_object_create_bad_md5_invalid_garbage_aws4',
    'test_object_create_bad_ua_empty_aws4',
    'test_object_create_bad_ua_none_aws4',
    'test_object_create_bad_ua_unreadable_aws4',
    'test_object_create_missing_signed_custom_header_aws4',
    'test_object_create_missing_signed_header_aws4',
    'test_object_raw_get_x_amz_expires_not_expired',
    'test_object_raw_get_x_amz_expires_out_max_range',
    'test_object_raw_get_x_amz_expires_out_positive_range',
    'test_object_raw_get_x_amz_expires_out_range_zero',
    'test_region_bucket_create_master_access_remove_secondary',
    'test_region_bucket_create_secondary_access_remove_master',
    'test_region_copy_object',
    'test_sse_kms_barb_transfer_13b',
    'test_sse_kms_barb_transfer_1b',
    'test_sse_kms_barb_transfer_1kb',
    'test_sse_kms_barb_transfer_1MB'
];

const S3_CEPH_TEST_STEMS_REGEXP = new RegExp(`(${S3_CEPH_TEST_STEMS.join(')|(')})`);

/*// s3tests.tests.test_realistic:TestFileValidator.test_new_file_is_valid
//Some tests have to be different and have a different path
const S3_CEPH_TEST_STEMS_2 = [
    's3tests.tests.test_realistic.',
];
const S3_CEPH_TEST_STEMS_2_REGEXP = new RegExp(`(${S3_CEPH_TEST_STEMS_2.join(')|(')})`);*/


module.exports = {
    run_test: run_test
};

async function ceph_test_setup() {
    console.info(`Updating ${CEPH_TEST.ceph_config} with host = ${s3_ip}...`);
    // update config with the s3 endpoint
    const conf_file = `${CEPH_TEST.test_dir}${CEPH_TEST.ceph_config}`;
    const conf_file_content = (await fs.promises.readFile(conf_file)).toString();
    const new_conf_file_content = conf_file_content.replace(/host = localhost/g, `host = ${s3_ip}`);
    await fs.promises.writeFile(conf_file, new_conf_file_content);
    console.log('conf file updated');

    //await test_utils.create_hosts_pool(client, CEPH_TEST.pool, 3);
    let system = await client.system.read_system();
    const internal_pool = system.pools.filter(p => p.resource_type === 'INTERNAL');
    await client.account.create_account({
        ...CEPH_TEST.new_account_params,
        default_resource: internal_pool.name
    });

    await client.account.create_account({
        ...CEPH_TEST.new_account_params_tenant,
        default_resource: internal_pool.name
    });
    system = await client.system.read_system();
    const ceph_account = system.accounts.find(account =>
        account.email.unwrap() === CEPH_TEST.new_account_params.email
    );

    const ceph_account_tenant = system.accounts.find(account =>
        account.email.unwrap() === CEPH_TEST.new_account_params_tenant.email
    );

    console.info('CEPH TEST CONFIGURATION:', JSON.stringify(CEPH_TEST));
    const { access_key, secret_key } = ceph_account.access_keys[0];
    await os_utils.exec(`echo access_key = ${access_key.unwrap()} >> ${CEPH_TEST.test_dir}${CEPH_TEST.ceph_config}`);
    await os_utils.exec(`echo secret_key = ${secret_key.unwrap()} >> ${CEPH_TEST.test_dir}${CEPH_TEST.ceph_config}`);

    const { access_key: access_key_tenant, secret_key: secret_key_tenant } = ceph_account_tenant.access_keys[0];
    if (process.platform === 'darwin') {
        await os_utils.exec(`sed -i "" "s|tenant_access_key|${access_key_tenant.unwrap()}|g" ${CEPH_TEST.test_dir}${CEPH_TEST.ceph_config}`);
        await os_utils.exec(`sed -i "" "s|tenant_secret_key|${secret_key_tenant.unwrap()}|g" ${CEPH_TEST.test_dir}${CEPH_TEST.ceph_config}`);

    } else {
        await os_utils.exec(`sed -i -e 's:tenant_access_key:${access_key_tenant.unwrap()}:g' ${CEPH_TEST.test_dir}${CEPH_TEST.ceph_config}`);
        await os_utils.exec(`sed -i -e 's:tenant_secret_key:${secret_key_tenant.unwrap()}:g' ${CEPH_TEST.test_dir}${CEPH_TEST.ceph_config}`);
        await os_utils.exec(`sed -i -e 's:s3_access_key:${s3_acc_key}:g' ${CEPH_TEST.test_dir}${CEPH_TEST.ceph_config}`);
        await os_utils.exec(`sed -i -e 's:s3_secret_key:${s3_sec_key}:g' ${CEPH_TEST.test_dir}${CEPH_TEST.ceph_config}`);
    }
}

// async function deploy_ceph() {
//     console.info('Starting Deployment Of Ceph Tests...');
//     let command = `cd ${CEPH_TEST.test_dir};./${CEPH_TEST.ceph_deploy} ${os.platform() === 'darwin' ? 'mac' : ''} > /tmp/ceph_deploy.log`;
//     try {
//         let res = await os_utils.exec(command, {
//             ignore_rc: false,
//             return_stdout: true
//         });
//         console.info(res);
//     } catch (err) {
//         console.error('Failed Deployment Of Ceph Tests', err, err.stack);
//         throw new Error('Failed Deployment Of Ceph Tests');
//     }
// }

async function run_single_test(test) {
    let ceph_args = `S3TEST_CONF=${CEPH_TEST.test_dir}${CEPH_TEST.ceph_config}`;
    if (S3_CEPH_TEST_SIGV4.includes(test)) {
        ceph_args += ` S3_USE_SIGV4=true`;
    }
    let base_cmd = `${ceph_args} ./${CEPH_TEST.test_dir}${CEPH_TEST.s3_test_dir}virtualenv/bin/nosetests`;
    let res;
    let test_name;
    //Check if test should run
    if (!S3_CEPH_TEST_OUT_OF_SCOPE_REGEXP.test(test)) {
        try {
            test_name = test.replace(S3_CEPH_TEST_STEMS_REGEXP, pref => `${pref.slice(0, -1)}:`); //Match against the common test path
            if (test_name.includes('boto')) {
                base_cmd = `${ceph_args} ./${CEPH_TEST.test_dir}${CEPH_TEST.s3_test_dir}virtualenv/bin/nosetests -v -s -A 'not fails_on_rgw'`;
            }
            //test_name = test_name.replace(S3_CEPH_TEST_STEMS_2_REGEXP, pref => `${pref.slice(0, -1)}:`); //Match against test_realistic path
            res = await os_utils.exec(`${base_cmd} ${test_name}`, { ignore_rc: false, return_stdout: true });
            if (res.indexOf('SKIP') >= 0) {
                console.warn('Test skipped:', test);
                stats.skip.push(test);
            } else {
                console.info('Test Passed:', test);
                stats.pass.push(test);
            }
        } catch (err) {
            console.error('Test Failed:', test);
            stats.fail.push(test);
        }
    }
}

async function test_worker() {
    for (; ;) {
        const t = tests_list.shift();
        if (!t) return;
        await run_single_test(t);
    }
}

async function run_all_tests() {
    console.info('Running Ceph S3 Tests...');
    const tests_list_command =
        `S3TEST_CONF=${CEPH_TEST.test_dir}${CEPH_TEST.ceph_config}  ./${CEPH_TEST.test_dir}${CEPH_TEST.s3_test_dir}virtualenv/bin/nosetests -v --collect-only  2>&1 | awk '{print $1}' | grep test`;
    try {
        tests_list = await os_utils.exec(tests_list_command, { ignore_rc: false, return_stdout: true });
    } catch (err) {
        console.error('Failed getting tests list');
        throw new Error(`Failed getting tests list ${err}`);
    }

    tests_list = tests_list.split('\n');
    stats.total = tests_list.length;

    await P.map(_.times(5), test_worker);

    console.log('Finished Running Ceph S3 Tests');
}

async function main() {
    try {
        await run_test();
    } catch (err) {
        console.error(`Ceph Test Failed: ${err}`);
        process.exit(1);
    }
    process.exit(0);
}

async function run_test() {
    try {
        await client.create_auth_token(auth_params);
    } catch (err) {
        console.error('Failed create auth token', err);
        throw new Error('Failed create auth token');
    }

    try {
        await ceph_test_setup();
    } catch (err) {
        console.error('Failed setup ceph tests', err);
        throw new Error('Failed setup ceph tests');
    }

    try {
        await run_all_tests();
    } catch (err) {
        console.error('Failed running ceph tests', err);
        throw new Error('Running Ceph Tests Failed');
    }

    console.info(`CEPH TEST SUMMARY: Suite contains ${stats.total}, ran ${stats.pass.length + stats.fail.length + stats.skip.length} tests, Passed: ${stats.pass.length}, Skipped: ${stats.skip.length}, Failed: ${stats.fail.length}`);
    if (stats.skip.length) {
        console.warn(`CEPH TEST SUMMARY:  ${stats.skip.length} skipped tests ${stats.skip.join('\n')}`);
    }
    if (stats.fail.length) {
        console.error(`CEPH TEST SUMMARY: ${stats.fail.length} failed tests \n${stats.fail.join('\n')}`);
        throw new Error('Ceph Tests Returned with Failures');
    }
}

if (require.main === module) {
    main();
}
