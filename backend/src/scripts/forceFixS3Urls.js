#!/usr/bin/env node
const { S3Client, ListObjectsV2Command } = require('@aws-sdk/client-s3');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const S3_BUCKET = 'competitor-lens-screenshots';
const AWS_REGION = 'eu-central-1';
const CDN_URL = `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com`;

const s3Client = new S3Client({
  region: AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

async function listS3() {
  const map = new Map();
  let token = null;
  do {
    const cmd = new ListObjectsV2Command({
      Bucket: S3_BUCKET,
      Prefix: 'screenshots/',
      ContinuationToken: token
    });
    const res = await s3Client.send(cmd);
    if (res.Contents) {
      for (const obj of res.Contents) {
        const fileName = obj.Key.split('/').pop();
        if (fileName && /\.(png|jpg|jpeg|webp)$/i.test(fileName)) {
          map.set(fileName, obj.Key);
        }
      }
    }
    token = res.IsTruncated ? res.NextContinuationToken : null;
  } while (token);
  return map;
}

async function fix() {
  console.log('🔍 Scanning S3...');
  const s3Map = await listS3();
  console.log(`✅ Found ${s3Map.size} S3 files\n`);

  const screenshots = await prisma.screenshot.findMany({
    select: { id: true, fileName: true, cdnUrl: true }
  });
  console.log(`📊 Database: ${screenshots.length} records\n`);

  let updated = 0;
  for (const shot of screenshots) {
    if (!shot.fileName) continue;
    
    const s3Key = s3Map.get(shot.fileName);
    if (!s3Key) continue;
    
    const correctUrl = `${CDN_URL}/${s3Key}`;
    if (shot.cdnUrl !== correctUrl) {
      await prisma.screenshot.update({
        where: { id: shot.id },
        data: { cdnUrl: correctUrl }
      });
      updated++;
      if (updated % 100 === 0) console.log(`✅ ${updated}...`);
    }
  }

  console.log(`\n✅ Updated ${updated} URLs`);
  await prisma.$disconnect();
}

fix().catch(e => { console.error(e); process.exit(1); });
