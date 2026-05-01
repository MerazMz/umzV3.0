import axios from 'axios';
import { DEFAULT_HEADERS } from '../config/constants.js';

/**
 * Creates an Axios client configured with session cookies
 * @param {string} cookieString - Cookie string from authenticated session
 * @returns {import('axios').AxiosInstance} - Configured Axios instance
 */
export function createAxiosClient(cookieString) {
    return axios.create({
        headers: {
            ...DEFAULT_HEADERS,
            'Cookie': cookieString
        }
    });
}
