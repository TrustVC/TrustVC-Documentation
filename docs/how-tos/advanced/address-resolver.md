---
id: address-resolver
title: Address Resolver
sidebar_label: Address Resolver
---

Different companies may choose to use different pseudo-identity, some of these identifiers are reused and some are not. For those companies who chose to reuse a pseudo-identity, there is almost always a need to point to them again when doing transactions because it acts as an identifier to the user / company when doing transactions with them. Examples of such resources could be a shipping line wallet, multi-sig wallet or eBL token registry. Read more about identifier resolution framework <a href="https://github.com/Open-Attestation/adr/blob/master/identifier_resolution_framework.md" target="_blank" rel="noopener noreferrer">here</a>.

## TrustVC's address resolution

For TrustVC, currently there are 2 ways of resolving identities, 1 is through a local address book, the other is via 3rd party resolver API. These are accessible from the gear icon on the far right of the top navigation bar on the TrustVC website.

![Setting](/docs/reference/trustvc-website/settings-address-book1.png)

> For implementation reference, see the [TrustVC package](https://github.com/TrustVC/trustvc). The `@trustvc/trustvc` package is used for document verification and does not expose dedicated address-resolver APIs, so address resolution is configured and handled at the application settings layer.

## Address Book (Local)

Address Book is like a local phone book. The data is in a csv/excel format, where the minimal required columns are:

- `Name` (refers to the resolved company or entity name)
- `Address` (refers to the Wallet address)

![Addressbook](/docs/reference/trustvc-website/settings-address-book.png)

After importing the csv/excel sheet, previously ethereum addresses (where resolvable) should now be resolved to recognizable identities as defined within the imported sheet.

### Setup

So to recap the steps on setting your own local addressbook:

1. First, prepare a csv/excel sheet with `Name` and `Address` columns. For example:
   ![local csv](/docs/reference/trustvc-website/local-csv.png)
2. Develop an import csv file feature in your application. You'll need to:
   - Convert file to string. For example:

      ```ts
      const readAsText = async (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          if (reader.error) {
            reject(reader.error);
          }
          reader.onload = () => resolve(reader.result as string);
          reader.readAsText(file);
        });
      };
      ```
   - Then convert string to key value object. For example:

      ```ts
      import { parse } from "papaparse";

      const csvToAddressBook = (csv: string) => {
        const parsed = parse(csv, { skipEmptyLines: true, header: true });
        const data = parsed.data;
        const addressBook: Record<string, string> = {};

        data.forEach((row: any) => {
          const nameText = row.Name || row.name || row.Identifier || row.identifier;
          const addressText = row.Address || row.address;
          if (!addressText || !nameText) return;
          addressBook[addressText.toLowerCase()] = nameText;
        });

        return addressBook;
      };

      const csv = await readAsText(file);
      const addressBook = csvToAddressBook(csv);
      ```
3. Finally, if a local address matches, return the `Name` from your csv/excel file.

   ```js
   const addressToMatch = "0xabc..."; // your local address
   for (const [key, value] of Object.entries(addressBook)) {
     if (addressToMatch === key) {
       return value;
     }
   }
   ```

## Address Resolver (Third party)

For our reference implementation, we are using Google Sheets as our "database" for demonstrating the third party address resolution concept conveniently. Similar to local address book, think of it as a list of records that map ethereum addresses to a defined label name within the google sheet columns.

In the settings page you can add your third party address resolver. It enables you to add a third party's endpoint to resolve Ethereum addresses to their company's name. With Ethereum addresses being cryptic to end users, this Address Resolver will act as a digital address book, think of it as your mobile phone contact list, we only remember names, not numbers. The address book allows end users to see familiar identifiers such as `ABC Pte Ltd`. Once the Address Resolver endpoint has been added, when you verify a document with an identifiable Ethereum address, it will look like the following:

![Address-resolved](/docs/reference/trustvc-website/address-resolved.png)

You can see that the company's name and resolver details will also be displayed above the resolved Ethereum
address.

> You are not restricted to Google Sheets approach and is free to use any other backend solutions.

### How to set up a 3rd party Address Resolver (Google Sheet approach)

_Prerequisite: [Google sheets API](https://developers.google.com/sheets/api/reference/rest)._

- Go to [Google Console](https://console.cloud.google.com/apis/library) and create a new project.
  ![create project](/docs/reference/trustvc-website/create-project.png)
- Enable Google Sheets API. Once enabled, it should be added to the enabled API list.
  ![enable api](/docs/reference/trustvc-website/enable-api.png)
- Create an API key.
  ![create key](/docs/reference/trustvc-website/create-key.png)
- Create and populate a Google Sheet with columns of:
  - `Name` (The name of the company)
  - `Address` (The Ethereum address of the company)
- Set Google Sheet to public.
- Setup the third party resolution service by configuring it to access Google Sheets with the API key from step 1.
  - Use your own resolver service implementation repository for deployment.
  - Define these environment variables in your deployment secrets:
    - SHEETS_API_KEY = Your created API key from Google Console.
    - SHEETS_ID = Your google sheet ID.
    - SHEETS_RANGE = Your google sheet cell range.
    - STAGING_AWS_ACCESS_KEY_ID = Your AWS access key id.
    - STAGING_AWS_SECRET_ACCESS_KEY = Your AWS access key secret.
  - Deploy this service using your CI/CD pipeline.
  - Go to API Gateway in your AWS account. Create a custom domain name of your preference. Take note of API Gateway domain name.
    ![api gateway](/docs/reference/trustvc-website/api-gateway.png)
  - Click API mappings and configure it by selecting your deployed resolver API from the dropdown list.
  - Go to Route53 and create a new CNAME record. The value is your API Gateway domain name.
    ![route53](/docs/reference/trustvc-website/route53.png)
  - Once set, wait for a few minutes and your API endpoint will be accessible in the custom domain name that you've created. This will be what we call the third party resolution service endpoint.
- Go to the website application, clicking the "+ Add" button in the settings page will show you following:

![Settings](/docs/reference/trustvc-website/address-resolver-empty-form.png)

- Fill in the following:
  - `name` (A label you want to name this endpoint, this will be reflected as the "Resolved by")
  - `endpoint` (The third party resolution service endpoint that you've deployed)
  - `API Header and API Key` (The authentication configured on the resolver service)

![Settings-filled](/docs/reference/trustvc-website/address-resolver-filled-form.png)

---

#### Name

The "Name" input refers to the name of the address resolver that contains all the mappings of companies and their respective Ethereum address. For example, "BANKS.SG" could be the address resolver for all banks in Singapore.

---

#### Endpoint

The "Endpoint" input refers to the endpoint that will be called to resolve an Ethereum Address.
A demo hosted endpoint can be provided from your deployed resolver service endpoint.

![return-search](/docs/reference/trustvc-website/return-search.png)

_Note: For production environments, host and secure your own resolver endpoint._

---

#### API Header and API Key

For the API to know that you are an authorised user, an API Key is required and you will need to pass it in through an
API Header. An example would be `x-api-key` for the API Header and `DEMO` for the API Key.
