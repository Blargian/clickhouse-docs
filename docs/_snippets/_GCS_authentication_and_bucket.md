
<details>
    <summary>Create GCS buckets and an HMAC key</summary>

### ch_bucket_us_east1 



### ch_bucket_us_east4 



### Generate an Access key 

### Create a service account HMAC key and secret 

Open **Cloud Storage > Settings > Interoperability** and either choose an existing **Access key**, or **CREATE A KEY FOR A SERVICE ACCOUNT**.  This guide covers the path for creating a new key for a new service account.



### Add a new service account 

If this is a project with no existing service account, **CREATE NEW ACCOUNT**.



There are three steps to creating the service account, in the first step give the account a meaningful name, ID, and description.



In the Interoperability settings dialog the IAM role **Storage Object Admin** role is recommended; select that role in step two.



Step three is optional and not used in this guide.  You may allow users to have these privileges based on your policies.



The service account HMAC key will be displayed.  Save this information, as it will be used in the ClickHouse configuration.



</details>
