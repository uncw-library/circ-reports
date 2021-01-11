Circ-Reports

A node job that runs every weekday at 0500.  It transfers library fines & notifies people.
And an Express app with ldap login & a page at https://localhost:3001/report

## Dev box

   1)  Create a file at circ-report/.env (actual values are in Sharepoint password file or on Rancher transfers service)

```
NODE_ENV=development
DB_USER=ChangeMe!
DB_PASS=ChangeMe!
SIERRA_USER=ChangeMe!
SIERRA_PASS=ChangeMe!
LDAP_USER=ChangeMe!
LDAP_PASS=ChangeMe!
MASTER_DB_USER=ChangeMe!
MASTER_DB_PASS=ChangeMe!
```

   2)  Put a circ-reports db dump at circ-reports/db_autoimport/file.sql

      Get the Transfers db dump using command `pg_dump -h libapps-staff.uncw.edu -p 8020 -U postgres transfers > transfers_db_autoimport/transfers.sql`

   How the dev box doesn't write to real databases:

      The docker-compose will create a 'circ-reports' db on your local computer.  It will write to it instead of the production 'circ-reports' db.

      All the other db connections are readonly.  (Sierra & libapps-staff master db)

   4) Run the dev box:  `docker-compose up`

      Any code changes in ./transfers/app/ folder will live update inside the box.  It will also restart the program.

   5) Restart the dev box:

      ```
      docker-compose down
      docker volume rm circ-reports_postgres_data
      docker-compose up
      ```

      On first run, circ-reports processes all the outstanding items.

      On second run, there's nothing left to process.  So, we have to `docker-compose down` `docker volume rm circ-reports_postgres_data` to reset the local db.

## Build the image

   When your dev box seems right, 

   ```
   docker build --no-cache -t libapps-admin.uncw.edu:8000/randall-dev/circ-reports .
   docker push libapps-admin.uncw.edu:8000/randall-dev/circ-reports
   ```

   And update Rancher

## Production

   Works the same as dev, but pushes changes to libapps-staff 'circ-reports' db.
