const Minio = require('minio');
const fs = require('fs');
const path = require('path');

let s3 = null;
let bucket = '';

if (process.env.E2E_BASE && process.env.E2E_ACCESS_KEY && process.env.E2E_SECRET_KEY && process.env.E2E_BUCKET_NAME) {
    let endPoint = process.env.E2E_BASE;
    let useSSL = true;
    if (endPoint.startsWith('http://')) {
        useSSL = false;
        endPoint = endPoint.replace('http://', '');
    } else if (endPoint.startsWith('https://')) {
        endPoint = endPoint.replace('https://', '');
    }

    s3 = new Minio.Client({
        endPoint: endPoint,
        useSSL: useSSL,
        accessKey: process.env.E2E_ACCESS_KEY,
        secretKey: process.env.E2E_SECRET_KEY,
    });
    bucket = process.env.E2E_BUCKET_NAME;
} else {
    console.warn('Minio client not initialized: missing E2E_* environment variables');
}

const e2eS3File = async (method = 'upload', file, fileName, filePath, oldFilePath = '', preferExt) => {
    if (!s3) {
        console.warn('Minio client not initialized');
        return { completed: false, message: 'Minio not configured' };
    }
    const e2eUrlTemplate = `https://${bucket}.objectstore.e2enetworks.net`;
    const mimeToExt = {
        'image/jpeg': '.jpg',
        'image/jpg': '.jpg',
        'image/png': '.png',
        'application/pdf': '.pdf',
    };
    const extToMime = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.pdf': 'application/pdf',
    };

    let ext; // default

    if (preferExt) {
        ext = preferExt.startsWith('.') ? preferExt : `.${preferExt}`;
    } else if (file?.mimetype && mimeToExt[file.mimetype]) {
        ext = mimeToExt[file.mimetype];
    }

    // Resolve file content: buffer/stream/path string
    let fileContent = file?.buffer || file?.path || file;
    let isStream = false;
    let contentSize = undefined;

    const resolveFromPath = (p) => {
        try {
            const stat = fs.statSync(p);
            contentSize = stat.size;
            return fs.createReadStream(p);
        } catch (e) {
            return null;
        }
    };

    // If a plain string path is provided, read from disk
    if (typeof file === 'string' && fs.existsSync(file)) {
        const stream = resolveFromPath(file);
        if (stream) {
            fileContent = stream;
            isStream = true;
            // If no ext determined yet, infer from path
            if (!ext) ext = path.extname(file) || ext;
        }
    }

    // If file has a .path string (e.g., multer), read from that path
    if (!isStream && typeof file?.path === 'string' && fs.existsSync(file.path)) {
        const stream = resolveFromPath(file.path);
        if (stream) {
            fileContent = stream;
            isStream = true;
            if (!ext) ext = path.extname(file.path) || ext;
        }
    }

    // If we have a Buffer, set the size
    if (!isStream && Buffer.isBuffer(fileContent)) {
        contentSize = fileContent.length;
    }
    const filePathNamed = `${filePath}${filePath.endsWith('/') ? '' : '/'}${fileName}${ext}`;

    const deleteOneS3 = () => new Promise((resolve, reject) => {
        const objectsList = [];
        const stream = s3.listObjects(bucket, filePath, true);

        stream.on('data', (obj) => {
            if (obj.name.endsWith(`${fileName}${ext}`)) {
                objectsList.push(obj.name);
            }
        });

        stream.on('end', () => {
            s3.removeObjects(bucket, objectsList, (err) => {
                if (err) return reject({ completed: false, message: err });
                resolve({ completed: true });
            });
        });

        stream.on('error', (err) => reject({ completed: false, message: err }));
    });

    const uploadToS3 = async (customPath = filePathNamed) => {
        try {
            const contentType = file?.mimetype
                || (preferExt && extToMime[(preferExt.startsWith('.') ? preferExt : `.${preferExt}`).toLowerCase()])
                || (ext && extToMime[ext.toLowerCase()])
                || 'application/octet-stream';

            // When uploading streams to MinIO, provide content size
            if (isStream) {
                await s3.putObject(bucket, customPath, fileContent, contentSize, {
                    'Content-Type': contentType,
                });
            } else {
                await s3.putObject(bucket, customPath, fileContent, contentSize, {
                    'Content-Type': contentType,
                });
            }
            return {
                completed: true,
                url: `${e2eUrlTemplate}/${customPath}`,
                key: customPath
            };
        } catch (err) {
            console.log(err);
            return {
                completed: false,
                url: null,
                message: err.message,
            };
        }
    };

    switch (method) {
    case 'upload':
        return await uploadToS3();

    case 'uploadTemp': {
        const tempPath = filePathNamed.replace(ext, `__temp${ext}`);
        return await uploadToS3(tempPath);
    }

    case 'deleteOne':
        return await deleteOneS3();

    case 'deleteDir':
    case 'list': {
        return new Promise((resolve, reject) => {
            const objects = [];
            const stream = s3.listObjects(bucket, filePath, true);

            stream.on('data', (obj) => objects.push(obj));
            stream.on('end', () => {
                if (method === 'deleteDir') {
                    s3.removeObjects(bucket, objects.map((o) => o.name), (err) => {
                        if (err) return reject({ completed: false, message: err });
                        resolve({ completed: true });
                    });
                } else {
                    resolve({ completed: true, data: objects });
                }
            });
            stream.on('error', (err) => reject({ completed: false, message: err }));
        });
    }

    case 'check':
        try {
            await s3.statObject(bucket, filePathNamed);
            return {
                completed: true,
                url: `${e2eUrlTemplate}/${filePathNamed}`,
            };
        } catch (err) {
            return {
                completed: false,
                message: err.message,
            };
        }

    case 'changePath': {
        if (!oldFilePath || !oldFilePath.includes(e2eUrlTemplate)) {
            return { completed: false, message: 'Invalid oldFilePath' };
        }

        const source = oldFilePath.split(`${e2eUrlTemplate}/`)[1];
        try {
            await s3.copyObject(bucket, filePathNamed, `/${bucket}/${source}`);
            await deleteOneS3();
            return {
                completed: true,
                url: `${e2eUrlTemplate}/${filePathNamed}`,
            };
        } catch (err) {
            return {
                completed: false,
                message: err.message,
            };
        }
    }

    case 'deleteByKey': {
        // filePath param is used as the full object key
        const objectKey = filePath;
        try {
            await s3.removeObject(bucket, objectKey);
            return { completed: true };
        } catch (err) {
            return { completed: false, message: err.message };
        }
    }

    default:
        return await uploadToS3();
    }
};

module.exports = { e2eS3File };
