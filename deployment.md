# Planning Manager Deployment Guide

This document outlines the deployment process for the Planning Manager application to the planningmanager.ai domain.

## Domain Information

- **Domain**: planningmanager.ai
- **Registrar**: Hostinger
- **Expiration**: March 16, 2027 (with auto-renewal enabled)

## DNS Configuration

The domain is currently configured with the following DNS records:

### Nameservers
- ns1.dns-parking.com
- ns2.dns-parking.com

### A Record
- Host: @ (root domain)
- Points to: 84.32.84.32
- TTL: 50

### CNAME Records
- www.planningmanager.ai → planningmanager.ai (TTL: 300)
- hostingermail-a._domainkey → hostingermail-a.dkim.mail.hostinger.com (TTL: 300)
- hostingermail-b._domainkey → hostingermail-b.dkim.mail.hostinger.com (TTL: 300)
- hostingermail-c._domainkey → hostingermail-c.dkim.mail.hostinger.com (TTL: 300)
- autodiscover → autodiscover.mail.hostinger.com (TTL: 300)
- autoconfig → autoconfig.mail.hostinger.com (TTL: 300)

## Deployment Steps

### 1. Prepare the Application

1. Update environment variables in `.env.production`:
   ```
   NEXT_PUBLIC_APP_ENV=production
   NEXT_PUBLIC_APP_DOMAIN=planningmanager.ai
   NEXT_PUBLIC_APP_URL=https://planningmanager.ai
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

2. Build the application:
   ```
   npm run build
   ```

### 2. Hosting Setup

#### Option 1: Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Configure environment variables in the Vercel dashboard
3. Set up custom domain in Vercel:
   - Add planningmanager.ai as a custom domain
   - Follow Vercel instructions to update DNS settings

#### Option 2: Traditional Hosting

1. Upload the build output to your web server
2. Configure your web server (Apache/Nginx) to serve the application
3. Set up SSL certificates using Let's Encrypt

### 3. Supabase Configuration

1. In Supabase dashboard, go to Authentication settings
2. Update Site URL to `https://planningmanager.ai`
3. Add `https://planningmanager.ai/api/auth/callback` and `https://planningmanager.ai/auth/callback` to redirect URLs
4. Add `https://planningmanager.ai` to allowed CORS origins

### 4. SSL Configuration

1. Obtain SSL certificate for planningmanager.ai and www.planningmanager.ai
2. Configure web server to use HTTPS with proper SSL certificates
3. Redirect all HTTP traffic to HTTPS

### 5. Testing

1. Test authentication flow on the live site
2. Verify Supabase integration is working correctly
3. Test all major application features
4. Verify mobile responsiveness and cross-browser compatibility

## Maintenance

Regular maintenance tasks:

1. Renew SSL certificates if not using auto-renewal
2. Monitor domain expiration (currently set to auto-renew)
3. Update DNS records if hosting provider changes
4. Regularly backup the database

## Contact Information

For domain administration issues:
- Contact: Nathaniel Redmond
- Email: nfredmond@gmail.com
- Phone: +1 5304929775 