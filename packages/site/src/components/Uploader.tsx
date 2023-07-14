import React, { useState, ChangeEvent, useRef } from 'react';
import { ethers } from 'ethers';
import { getHashKey, sendSessionTransaction } from '../utils';

const sha3 = require('js-sha3').keccak_256;

const stringToHex = (s: string) =>
  ethers.utils.hexlify(ethers.utils.toUtf8Bytes(s));

const readFile = async (file: File) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (res) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      resolve(Buffer.from(res.target.result));
    };
    reader.readAsArrayBuffer(file);
  });
};

const bufferChunk = (buffer: Buffer, chunkSize: number) => {
  let i = 0;
  const result: Buffer[] = [];
  const len = buffer.length;
  const chunkLength = Math.ceil(len / chunkSize);
  while (i < len) {
    result.push(buffer.slice(i, (i += chunkLength)));
  }
  return result;
};

export const FileUploader = ({ sessionSinger, setUploadFileInfo }) => {
  const allowMultiple = false;
  const maxFileSize = 5;

  const MAX_FILE_BYTES = maxFileSize * 1024 * 1024; // MB to bytes

  // Change the state structure to handle multiple file progress and status
  const [fileProgress, setFileProgress] = useState<{ [key: string]: number }>(
    {},
  );
  const [fileStatus, setFileStatus] = useState<{ [key: string]: string }>({});
  const [isUpload, setUpload] = useState<boolean>(false);

  // Create a ref for the file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isError = Object.values(fileStatus).some(
    (status) => status !== 'Uploaded',
  );

  const resetUploader = () => {
    setFileProgress({});
    setFileStatus({});
    setUpload(false);
    setUploadFileInfo(null);
  };

  const fileUploadHandler = async (file: File) => {
    const { name, size } = file;
    const content = await readFile(file);

    let chunks: Buffer[] = [];
    const chunkLength = 24 * 1024 - 326;
    // Data need to be sliced if file > 475K
    if (size > chunkLength) {
      const chunkSize = Math.ceil(size / chunkLength);
      chunks = bufferChunk(content as Buffer, chunkSize);
    } else {
      chunks.push(content as Buffer);
    }

    const hexName = stringToHex(name);
    let uploadState = true;
    // eslint-disable-next-line guard-for-in
    for (const index in chunks) {
      const chunk = chunks[index];
      const hexData = `0x${chunk.toString('hex')}`;
      const localHash = `0x${sha3(chunk)}`;
      const hash = await getHashKey(sessionSinger, hexName, index);
      if (localHash === hash) {
        console.log(`File ${name} chunkId: ${index}: The data is not changed.`);
        const progress = Math.ceil(((Number(index) + 1) / chunks.length) * 100);
        setFileProgress((prev) => ({ ...prev, [name]: progress }));
        continue;
      }

      try {
        // file is remove or change
        const receipt = await sendSessionTransaction(
          sessionSinger,
          0,
          index,
          hexName,
          hexData,
        );
        if (!receipt) {
          uploadState = false;
          break;
        }
        const progress = Math.ceil(((Number(index) + 1) / chunks.length) * 100);
        setFileProgress((prev) => ({ ...prev, [name]: progress }));
      } catch (e) {
        console.log(e);
        uploadState = false;
        break;
      }
    }

    if (uploadState) {
      const progress = 100;
      setFileProgress((prev) => ({ ...prev, [name]: progress }));
      setUploadFileInfo(name);
    } else {
      const fileErrors: { [key: string]: string } = {};
      fileErrors[file.name] = `File Upload Error`;
      setFileStatus(fileErrors);
    }
  };

  const fileSelectedHandler = (event: ChangeEvent<HTMLInputElement>) => {
    resetUploader();

    setUpload(true);
    if (event.target.files) {
      const files = Array.from(event.target.files);
      let isValid = true; // Flag to check if all files are valid
      const fileErrors: { [key: string]: string } = {};

      for (const file of files) {
        if (file.size > MAX_FILE_BYTES) {
          fileErrors[file.name] = `File size cannot exceed ${maxFileSize} MB`;
          isValid = false;
        }
      }

      if (!isValid) {
        setUpload(false);
        setFileStatus(fileErrors);
        return;
      }

      files.forEach((file) => {
        setFileProgress((prev) => ({ ...prev, [file.name]: 0 }));
        fileUploadHandler(file).then(() => {
          setUpload(false);
        });
      });
    }
  };

  return (
    <div>
      <div className="form-control w-full">
        <div>Max File Size: 5MB; Accepted All Audio File Types</div>
        <input
          type="file"
          style={{ marginTop: '20px' }}
          onChange={fileSelectedHandler}
          accept="audio/*"
          disabled={isUpload}
          ref={fileInputRef}
          multiple={allowMultiple} // Added the 'multiple' attribute conditionally
        />
      </div>

      {isError ? (
        <div>
          {Object.entries(fileStatus).map(([fileName, error]) => (
            <div key={fileName} style={{ marginTop: '20px', color: 'red' }}>
              Error: {error}
            </div>
          ))}
        </div>
      ) : (
        <div>
          {Object.entries(fileProgress).map(([fileName, progress]) => (
            <div key={fileName} style={{ marginTop: '20px' }}>
              <progress style={{ width: '85%' }} value={progress} max="100" />
              {progress === 100 ? <span style={{marginLeft: '5px'}}>Success!</span> : (<></>)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
