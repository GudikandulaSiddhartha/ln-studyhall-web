# Deployment Guide

## Vercel Frontend

1. Import the repository in Vercel.
2. Set root directory to `apps/web`.
3. Add environment variables:

```bash
NEXT_PUBLIC_API_URL=https://your-api-host.com/api
NEXT_PUBLIC_GOOGLE_MAPS_KEY=your_key
```

4. Deploy with the default Next.js build command.

## Railway Backend

1. Create a PostgreSQL database in Railway.
2. Create a service from this repository.
3. Set root directory to `apps/api`.
4. Add environment variables:

```bash
DATABASE_URL=postgresql://...
JWT_SECRET=long_random_secret
FRONTEND_URL=https://your-vercel-domain.vercel.app
PORT=4000
```

5. Run database migration:

```bash
npm run prisma:dev -w apps/api
```

6. Start command:

```bash
npm run start -w apps/api
```

## Cloudinary

Add the following variables to the API service:

```bash
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Use signed upload routes for admin gallery uploads and store `url` plus `publicId` in the `Photo` table.

## AWS Option

- API: ECS Fargate or Elastic Beanstalk.
- Database: RDS PostgreSQL.
- Static frontend: Vercel or Amplify.
- Media: Cloudinary or S3 plus CloudFront.

## Production Checklist

- Replace local JWT secret.
- Enable HTTPS only cookies if adding cookie sessions.
- Configure OAuth redirect URLs.
- Add monitoring and error tracking.
- Enable daily database backups.
- Add Redis locking for high-traffic seat booking windows.

