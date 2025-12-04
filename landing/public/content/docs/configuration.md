# Config SmooSense to display media files and access S3

## Displaying images/videos

### Relative or absolute path on your local computer
Assuming you have table file and folder structure as below

```bash
/Users/xxx/Downloads/
├── table.parquet
└── images
   ├── one.jpg
   ├── two.jpg
   └── three.jpg
```
Then you can use relative path (based on the table file), or absolute path to display images/videos. 
Here is one example:

| id | name | image_rel_path | image_abs_path | metadata | score |
|----|------|----------------|----------------|----------|-------|
| 1 | First | `./images/one.jpg` | `/Users/xxx/Downloads/images/one.jpg` | Sample metadata | 0.95 |
| 2 | Second | `./images/two.jpg` | `/Users/xxx/Downloads/images/two.jpg` | Another entry | 0.87 |
| 3 | Third | `./images/three.jpg` | `/Users/xxx/Downloads/images/three.jpg` | Final record | 0.92 |

Note that the relative path must **start with `./`** and absolute path must start with `/`.

### Public url
For public data, you can expose them as urls and put the url in table cells. For example:

```bash
http://images.cocodataset.org/train2017/000000211189.jpg
```

### On AWS S3 or S3-compatible storage
Full S3 url is also supported. For example:
```bash
s3://bucket/path/to/file.jpg
```

Note that you need to setup AWS S3 authentication. See below. 

### Customized private urls
If you data is private, you can run an API to proxy the url.
On the server side, use cookie to authenticate requests.

Make sure the url ends with an image extension (e.g. `.jpg`) for it to be treated as image url. The same for video.

## S3 authentication
### AWS S3
It is recommended to setup your AWS credentials using [AWS CLI v2](https://docs.aws.amazon.com/cli/latest/userguide/cli-chap-welcome.html#welcome-versions-v2).

If you use `default` profile or set credentials using `AWS_*` environment variables, you can simply run `sense` to start SmooSense.
```bash
sense # I will pick up global AWS config
```

To use a profile, run 
```bash
AWS_PROFILE=xxx sense
```

### S3-compatible storage
Other blob storages that support `boto3` sdk are also supported. 
You need to provide the endpoint url for that storage. 
Below is an example for CloudFlare R2 storage: 

```bash
AWS_ENDPOINT_URL=https://<account-id>.r2.cloudflarestorage.com AWS_PROFILE=r2 sense
```

## Run with a specific port number and url prefix

```bash
sense --port 8888 --url-prefix /subpath
```