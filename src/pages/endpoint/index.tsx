import React from 'react';
import { useFormik } from 'formik';
import { getAppId, getDefaultAppIdAndUrl, getSocketURL } from '@/components/shared';
import { isLocal } from '@/components/shared/utils/config/config';
import { Button, Input, Text } from '@deriv-com/ui';
import { LocalStorageConstants } from '@deriv-com/utils';
import './endpoint.scss';

const PASSPHRASE = process.env.ENDPOINT_PASSPHRASE ?? '';

const Endpoint = () => {
    const [unlocked, setUnlocked] = React.useState(isLocal());
    const [passphrase, setPassphrase] = React.useState('');
    const [passError, setPassError] = React.useState('');

    const formik = useFormik({
        initialValues: {
            appId: localStorage.getItem(LocalStorageConstants.configAppId) ?? getAppId(),
            serverUrl: localStorage.getItem(LocalStorageConstants.configServerURL) ?? getSocketURL(),
        },
        onSubmit: values => {
            localStorage.setItem(LocalStorageConstants.configServerURL, values.serverUrl);
            localStorage.setItem(LocalStorageConstants.configAppId, values.appId.toString());
            formik.resetForm({ values });
        },
        validate: values => {
            const errors: { [key: string]: string } = {};
            if (!values.serverUrl) {
                errors.serverUrl = 'This field is required';
            }
            if (!values.appId) {
                errors.appId = 'This field is required';
            } else if (!/^[a-zA-Z0-9_-]+$/.test(values.appId.toString().trim())) {
                errors.appId = 'Please enter a valid app ID';
            }
            return errors;
        },
    });

    if (!unlocked) {
        return (
            <div className='endpoint'>
                <Text weight='bold' className='endpoint__title'>
                    Developer Access Required
                </Text>
                <p className='endpoint__description'>
                    This page allows changing the API server and OAuth App ID. Enter the developer passphrase to
                    continue.
                </p>
                <form
                    className='endpoint__form'
                    onSubmit={e => {
                        e.preventDefault();
                        if (passphrase === PASSPHRASE) {
                            setUnlocked(true);
                            setPassError('');
                        } else {
                            setPassError('Incorrect passphrase');
                        }
                    }}
                >
                    <Input
                        label='Passphrase'
                        name='passphrase'
                        type='password'
                        value={passphrase}
                        onChange={e => setPassphrase(e.target.value)}
                        message={passError}
                    />
                    <Button className='endpoint__button' type='submit'>
                        Unlock
                    </Button>
                </form>
            </div>
        );
    }

    return (
        <div className='endpoint'>
            <Text weight='bold' className='endpoint__title'>
                Change API endpoint
            </Text>
            <form onSubmit={formik.handleSubmit} className='endpoint__form'>
                <Input
                    data-testid='dt_endpoint_server_url_input'
                    label='Server'
                    name='serverUrl'
                    message={formik.errors.serverUrl as string}
                    onBlur={formik.handleBlur}
                    onChange={formik.handleChange}
                    value={formik.values.serverUrl}
                />
                <Input
                    data-testid='dt_endpoint_app_id_input'
                    label='OAuth App ID'
                    name='appId'
                    message={formik.errors.appId as string}
                    onBlur={formik.handleBlur}
                    onChange={formik.handleChange}
                    value={formik.values.appId}
                />
                <div>
                    <Button className='endpoint__button' disabled={!formik.dirty || !formik.isValid} type='submit'>
                        Submit
                    </Button>
                    <Button
                        className='endpoint__button'
                        color='black'
                        onClick={() => {
                            const { server_url, app_id } = getDefaultAppIdAndUrl();
                            localStorage.setItem(LocalStorageConstants.configServerURL, server_url);
                            localStorage.setItem(LocalStorageConstants.configAppId, app_id.toString());
                            formik.resetForm({
                                values: {
                                    appId: app_id,
                                    serverUrl: server_url,
                                },
                            });
                            window.location.reload();
                        }}
                        variant='outlined'
                        type='button'
                    >
                        Reset to original settings
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default Endpoint;
