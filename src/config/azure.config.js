import { ComputerVisionClient } from '@azure/cognitiveservices-computervision';
import { ApiKeyCredentials } from '@azure/ms-rest-js';
import { AZURE_CONFIG } from '../constants.js';

const computerVisionClient = new ComputerVisionClient(
    new ApiKeyCredentials({ inHeader: { 'Ocp-Apim-Subscription-Key': AZURE_CONFIG.key } }), 
    AZURE_CONFIG.endpoint
);

export { computerVisionClient };