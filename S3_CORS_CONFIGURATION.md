# S3 CORS Configuration Guide

Your S3 bucket needs CORS (Cross-Origin Resource Sharing) configured to allow direct uploads from your frontend application.

## How to Configure CORS on AWS S3 Bucket

### Method 1: Using AWS Console

1. **Go to AWS S3 Console**
   - Log in to AWS Console
   - Navigate to S3 service
   - Click on your bucket: `restrobazaar-bucket`

2. **Open Permissions Tab**
   - Click on the "Permissions" tab
   - Scroll down to "Cross-origin resource sharing (CORS)"

3. **Click "Edit" and Add CORS Configuration**

4. **Paste the Following CORS Configuration:**

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "PUT",
            "POST",
            "DELETE",
            "HEAD"
        ],
        "AllowedOrigins": [
            "http://localhost:5173",
            "https://restrobazaar.in",
            "https://www.restrobazaar.in"
        ],
        "ExposeHeaders": [
            "ETag",
            "x-amz-server-side-encryption",
            "x-amz-request-id",
            "x-amz-id-2"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

5. **Save Changes**

### Method 2: Using AWS CLI

Run this command in your terminal:

```bash
aws s3api put-bucket-cors --bucket restrobazaar-bucket --cors-configuration file://cors-config.json
```

Where `cors-config.json` contains:

```json
{
    "CORSRules": [
        {
            "AllowedHeaders": ["*"],
            "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
            "AllowedOrigins": [
                "http://localhost:5173",
                "https://restrobazaar.in",
                "https://www.restrobazaar.in"
            ],
            "ExposeHeaders": [
                "ETag",
                "x-amz-server-side-encryption",
                "x-amz-request-id",
                "x-amz-id-2"
            ],
            "MaxAgeSeconds": 3000
        }
    ]
}
```

### Method 3: Using AWS CloudFormation/Terraform (if applicable)

If you're using Infrastructure as Code, add the CORS configuration to your bucket resource.

## Important Notes:

1. **AllowedOrigins**: Add all domains where your frontend will be hosted
   - `http://localhost:5173` - for local development
   - `https://restrobazaar.in` - for production
   - `https://www.restrobazaar.in` - for www production

2. **AllowedMethods**: 
   - `PUT` is required for uploading files using presigned URLs
   - `GET` is required for reading files
   - `POST` and `DELETE` for other operations if needed

3. **AllowedHeaders**: `["*"]` allows all headers, which is useful for presigned URLs

4. **MaxAgeSeconds**: How long browsers cache the CORS preflight response (3000 seconds = ~50 minutes)

## Verify CORS is Working

After configuring CORS, you can verify it's working by:

1. Using curl:
```bash
curl -X OPTIONS https://restrobazaar-bucket.s3.ap-south-1.amazonaws.com/products/ \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: PUT" \
  -v
```

2. Check the response headers - you should see `Access-Control-Allow-Origin` header

## Troubleshooting

If you still get 403 errors after configuring CORS:

1. **Wait a few minutes** - CORS changes can take a few minutes to propagate
2. **Clear browser cache** - Old CORS responses might be cached
3. **Check bucket permissions** - Ensure your IAM user/role has `s3:PutObject` permission
4. **Verify allowed origins** - Make sure your frontend URL is in the AllowedOrigins list
