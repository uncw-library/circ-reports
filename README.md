Circ-Reports

Two apps in one repo: job & webapp.  Job is in ./job/app, and webapp is in ./webapp/app.

Each gets their own container.  This app is unusual for having two app containers.  Each may be revised & pushed independently.  The docker-compose dev box works as a single unit.

The node job runs every weekday at 0500.  It transfers library fines & notifies people.
The Express app with ldap login & a page at https://localhost:3001/report


## Build the image

    When your dev box seems right, build & push each of the containers (or only the one you revised).

    ```
    docker build --no-cache -t libapps-admin.uncw.edu:8000/randall-dev/circ-reports/job ./job/
    docker build --no-cache -t libapps-admin.uncw.edu:8000/randall-dev/circ-reports/webapp ./webapp/
    docker push libapps-admin.uncw.edu:8000/randall-dev/circ-reports/job
    docker push libapps-admin.uncw.edu:8000/randall-dev/circ-reports/webapp   
    ```

    And update Rancher services, or only the one you revised.

## Dev box

    1)  Create a file at circ-report/.env (actual values are in Sharepoint password file or on Rancher transfers service)

    ```
    NODE_ENV=development
    DB_USER=CHANGEME
    DB_PASS=CHANGEME
    SIERRA_USER=CHANGEME
    SIERRA_PASS=CHANGEME
    LDAP_USER=CHANGEME
    LDAP_PASS=CHANGEME
    MASTER_DB_USER=CHANGEME
    MASTER_DB_PASS=CHANGEME
    ```

    2)  Put a circ-reports db dump at circ-reports/db_autoimport/circ-reports.sql

    Get the Transfers db dump using command `pg_dump -h libapps-staff.uncw.edu -p 8036 -U postgres circ-reports > db_autoimport/circ-reports.sql`

    How the dev box doesn't write to real databases:

    The docker-compose will create a 'circ-reports' db on your local computer.  It will write to it instead of the production 'circ-reports' db.

    All the other db connections are read-only.  (Sierra & libapps-staff master db)

    4) Run the dev box:  `docker-compose up --build`

    Any code changes in ./transfers/app/ folder will live update inside the box.  It will also restart the program.

    5) Restart the dev box:

    ```
    docker-compose down
    docker volume rm circ-reports_postgres_data
    docker-compose up
    ```

    On first run, circ-reports processes all the outstanding items.

    On second run, there's nothing left to process.  So, we have to `docker-compose down` `docker volume rm circ-reports_postgres_data` to reset the local db.


## Production

    Works the same as dev, but pushes changes to libapps-staff master-db 'circ-reports' db & writes to joblog.
