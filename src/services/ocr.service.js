import { computerVisionClient } from '../config/azure.config.js';
import sharp from 'sharp';

class OCRService {
    constructor() {
        this.client = computerVisionClient;
    }
    validateImageFile(buffer) {
        if (!buffer || buffer.length < 4) {
            return { isValid: false, detectedType: 'unknown' };
        }
        const signatures = {
            jpeg: [0xFF, 0xD8, 0xFF],
            png: [0x89, 0x50, 0x4E, 0x47],
            bmp: [0x42, 0x4D],
            tiff_le: [0x49, 0x49, 0x2A, 0x00], 
            tiff_be: [0x4D, 0x4D, 0x00, 0x2A]  
        };
        for (const [type, signature] of Object.entries(signatures)) {
            let matches = true;
            for (let i = 0; i < signature.length && i < buffer.length; i++) {
                if (buffer[i] !== signature[i]) {
                    matches = false;
                    break;
                }
            }
            if (matches) {
                return { isValid: true, detectedType: type };
            }
        }

        return { isValid: false, detectedType: 'unknown' };
    }

    async preprocessImage(imageBuffer) {
        try {
            
            const validation = this.validateImageFile(imageBuffer);
            if (!validation.isValid) {
                throw new Error(`Invalid image file format. Detected type: ${validation.detectedType}`);
            }
            
            console.log(`📸 Detected image type: ${validation.detectedType}`);
            
            const processedImage = await sharp(imageBuffer)
                .resize(1200, null, { withoutEnlargement: true })
                .jpeg({ quality: 95 })
                .toBuffer();
            
            return processedImage;
        } catch (error) {
            console.error('Image preprocessing failed:', error);
            
            const validation = this.validateImageFile(imageBuffer);
            if (validation.isValid) {
                console.log('🔄 Using original buffer after preprocessing failed');
                return imageBuffer;
            }
            throw error;
        }
    }

    async extractTextFromDocument(imageBuffer) {
        try {
            const processedImage = await this.preprocessImage(imageBuffer);
            const result = await this.client.readInStream(processedImage);
            const operationId = result.operationLocation.split('/').slice(-1)[0];
            
            let readResult;
            let attempts = 0;
            const maxAttempts = 30;
            
            do {
                await new Promise(resolve => setTimeout(resolve, 1000));
                readResult = await this.client.getReadResult(operationId);
                attempts++;
                
                if (attempts >= maxAttempts) {
                    throw new Error('OCR operation timeout');
                }
            } while (readResult.status === 'running');

            if (readResult.status === 'succeeded') {
                const textLines = [];
                readResult.analyzeResult.readResults.forEach(page => {
                    page.lines.forEach(line => {
                        textLines.push(line.text);
                    });
                });
                return textLines.join('\n');
            }
            
            throw new Error(`OCR failed with status: ${readResult.status}`);
        } catch (error) {
            console.error('Azure OCR error:', error);
            throw error;
        }
    }

    detectDocumentType(text) {
        const normalizedText = text.toLowerCase();
        
        if (normalizedText.includes('aadhaar') || 
            normalizedText.includes('आधार') || 
            /\d{4}\s?\d{4}\s?\d{4}/.test(text)) {
            return 'aadhaar';
        }
        
        if (normalizedText.includes('passport') || 
            /[A-Z]\d{7}/.test(text)) {
            return 'passport';
        }
        
        return 'aadhaar';
    }

    extractInformationFromText(text, documentType) {
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        
        const result = {
            name: null,
            dob: null,
            phone: null,
            documentNumber: null,
            documentType: documentType
        };

        if (documentType === 'aadhaar') {
            result.name = this.extractAadhaarName(lines);
            result.dob = this.extractAadhaarDOB(lines);
            result.phone = this.extractAadhaarPhone(lines);
            result.documentNumber = this.extractAadhaarNumber(lines);
        } else if (documentType === 'passport') {
            result.name = this.extractPassportName(lines);
            result.dob = this.extractPassportDOB(lines);
            result.documentNumber = this.extractPassportNumber(lines);
        }

        return result;
    }

    extractAadhaarName(lines) {
        const skipWords = ['government', 'india', 'aadhaar', 'आधार', 'male', 'female', 'पुरुष', 'महिला'];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            if (skipWords.some(word => line.toLowerCase().includes(word.toLowerCase()))) {
                continue;
            }
            
            if (/^[A-Za-z\s]{2,50}$/.test(line) && line.length > 2) {
                return line.trim();
            }
        }
        return null;
    }

    extractAadhaarDOB(lines) {
        const dobPatterns = [
            /(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/,
            /(\d{1,2}\s(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s\d{4})/i,
            /(\d{4}[-\/]\d{1,2}[-\/]\d{1,2})/
        ];

        for (const line of lines) {
            for (const pattern of dobPatterns) {
                const match = line.match(pattern);
                if (match) {
                    return match[1];
                }
            }
        }
        return null;
    }

    extractAadhaarPhone(lines) {
        const phonePatterns = [
            /(?:mobile|phone|mob)[:\s]*(\+91[\s-]?)?([6-9]\d{9})/i,
            /\b([6-9]\d{9})\b/,
            /\+91[\s-]?([6-9]\d{9})/
        ];

        for (const line of lines) {
            if (/\d{4}\s?\d{4}\s?\d{4}/.test(line)) {
                continue;
            }
            
            for (const pattern of phonePatterns) {
                const match = line.match(pattern);
                if (match) {
                    const phoneNumber = match[2] || match[1];
                    if (phoneNumber && phoneNumber.length === 10) {
                        return phoneNumber;
                    }
                }
            }
        }
        return null;
    }

    extractAadhaarNumber(lines) {
        for (const line of lines) {
            const match = line.match(/\b(\d{4})\s?(\d{4})\s?(\d{4})\b/);
            if (match) {
                return match[1] + match[2] + match[3];
            }
        }
        return null;
    }

    extractPassportName(lines) {
        for (const line of lines) {
            if (line.toLowerCase().includes('given name') || 
                line.toLowerCase().includes('surname')) {
                const nameMatch = line.match(/(?:given name|surname)[:\s]+(.+)/i);
                if (nameMatch) {
                    return nameMatch[1].trim();
                }
            }
        }
        
        for (const line of lines) {
            if (/^[A-Za-z\s]{3,50}$/.test(line) && 
                !line.toLowerCase().includes('passport') &&
                !line.toLowerCase().includes('republic')) {
                return line.trim();
            }
        }
        return null;
    }

    extractPassportDOB(lines) {
        const dobPatterns = [
            /(?:date of birth|dob)[:\s]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/i,
            /(\d{1,2}[-\/]\d{1,2}[-\/]\d{4})/
        ];

        for (const line of lines) {
            for (const pattern of dobPatterns) {
                const match = line.match(pattern);
                if (match) {
                    return match[1];
                }
            }
        }
        return null;
    }

    extractPassportNumber(lines) {
        for (const line of lines) {
            const match = line.match(/\b([A-Z]\d{7})\b/);
            if (match) {
                return match[1];
            }
        }
        return null;
    }

    validateExtractedInfo(extractedInfo) {
        const validation = {
            isValid: true,
            errors: [],
            warnings: []
        };

        if (!extractedInfo.name || extractedInfo.name.length < 2) {
            validation.errors.push('Name not found or too short');
            validation.isValid = false;
        }

        if (!extractedInfo.dob) {
            validation.errors.push('Date of birth not found');
            validation.isValid = false;
        } else {
            const dobPattern = /^\d{1,2}[-\/]\d{1,2}[-\/]\d{4}$/;
            if (!dobPattern.test(extractedInfo.dob)) {
                validation.warnings.push('Date of birth format may be incorrect');
            }
        }

        if (!extractedInfo.phone) {
            validation.warnings.push('Phone number not found');
        } else if (!/^[6-9]\d{9}$/.test(extractedInfo.phone)) {
            validation.errors.push('Invalid phone number format');
            validation.isValid = false;
        }

        if (!extractedInfo.documentNumber) {
            validation.errors.push('Document number not found');
            validation.isValid = false;
        } else {
            if (extractedInfo.documentType === 'aadhaar' && 
                !/^\d{12}$/.test(extractedInfo.documentNumber)) {
                validation.errors.push('Invalid Aadhaar number format');
                validation.isValid = false;
            }
            
            if (extractedInfo.documentType === 'passport' && 
                !/^[A-Z]\d{7}$/.test(extractedInfo.documentNumber)) {
                validation.errors.push('Invalid passport number format');
                validation.isValid = false;
            }
        }

        return validation;
    }

    calculateConfidence(extractedInfo) {
        let score = 0;
        const fields = ['name', 'dob', 'phone', 'documentNumber'];
        
        fields.forEach(field => {
            if (extractedInfo[field] && extractedInfo[field].toString().trim()) {
                score += 25; 
            }
        });

        return Math.min(score, 100);
    }

    async processDocument(imageBuffer) {
        try {
            const extractedText = await this.extractTextFromDocument(imageBuffer);
            console.log('Extracted text:', extractedText);
            
            const documentType = this.detectDocumentType(extractedText);
            console.log('Detected document type:', documentType);
            
            const extractedInfo = this.extractInformationFromText(extractedText, documentType);
            console.log('Extracted info:', extractedInfo);
            
            const confidence = this.calculateConfidence(extractedInfo);
            
            return {
                success: true,
                documentType,
                extractedText,
                extractedInfo,
                confidence
            };

        } catch (error) {
            console.error('Document processing error:', error);
            throw error;
        }
    }
}

export default new OCRService();
