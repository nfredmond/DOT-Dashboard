# DNS Configuration for planningmanager.ai

This document provides detailed instructions for configuring DNS settings for the Planning Manager application on the planningmanager.ai domain.

## Current DNS Configuration

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

## Required DNS Configuration for Vercel Hosting

To host the Planning Manager application on Vercel, you'll need to update the DNS configuration as follows:

### Option 1: Using Vercel DNS

1. Transfer your domain to Vercel's DNS management:
   - In your Vercel dashboard, go to Domains
   - Add planningmanager.ai as a domain
   - Follow the instructions to update nameservers at your registrar (Hostinger)
   - Change nameservers from ns1.dns-parking.com and ns2.dns-parking.com to Vercel's nameservers

2. Vercel will automatically configure the necessary records for your application.

### Option 2: Using Hostinger DNS (Recommended)

If you prefer to keep DNS management with Hostinger:

1. Update the A record:
   - Host: @ (root domain)
   - Points to: 76.76.21.21 (Vercel's IP address)
   - TTL: 300 (or lower for faster propagation)

2. Add CNAME records for www and other subdomains:
   - Host: www
   - Points to: cname.vercel-dns.com
   - TTL: 300

3. Add TXT record for domain verification:
   - Host: @
   - Value: (provided by Vercel during domain setup)
   - TTL: 300

## SSL Configuration

Vercel will automatically provision and renew SSL certificates for your domain. No additional configuration is required for SSL.

## Email Configuration

The current email-related DNS records (DKIM, MX, etc.) should be preserved to maintain email functionality.

## Verification

After updating DNS settings:

1. Use a DNS lookup tool like [dnschecker.org](https://dnschecker.org) to verify your changes
2. Check that the domain resolves to Vercel's servers
3. Verify that SSL is working correctly by visiting https://planningmanager.ai
4. Test that www.planningmanager.ai redirects properly to the main domain

## Troubleshooting

If you encounter issues with DNS configuration:

1. Check that DNS changes have propagated (can take up to 48 hours, though usually much faster)
2. Verify that all required records are correctly configured
3. Check Vercel's domain settings page for any verification errors
4. Contact Vercel support if issues persist

## Contact Information

For domain administration issues:
- Contact: Nathaniel Redmond
- Email: nfredmond@gmail.com
- Phone: +1 5304929775 