/*
project database for db_one_table.js

The definitions can be loaded by running the command:
  psql my_database_name
At the psql prompt you then type:
  \i trader.sql
Ignore any errors from the DROP commands 
(these commands a just removing tables from your database if you have previously set up the database).
  
You can use:   
  pg_dump -f filename database
to save the data and definition of a database in this format. If you want to make complex changes to 
the database you may find it easiest to edit the definitions below and reload this file.
*/


--------------------------------------------------------------------------------------------------
-- First we tidy up earlier versions of the tables if they exist to avoid conflicts.
DROP TABLE project;


--------------------------------------------------------------------------------------------------
-- Next we create the tables for our database.
/*
-- Project table --
Contains the general state of a game. There will be one row for each game in progress.
*/
CREATE TABLE project (
  project_id integer Primary Key, --unique project ID
  project_name varchar(255) not null, --project name
  column_id integer Primary Key, --unique column id
  column_title varchar(255) not null, --column title
  column_position integer not null, --column position
  ticket_id integer Primary Key, --unique ticket id
  ticket_description varchar(255) --ticket description
);

--------------------------------------------------------------------------------------------------
-- Finally we populate the tables with the basic game state information.

-- Set up the star-systems.
INSERT INTO project VALUES(0, 'test name', 0, 'test column name', 0, 0, 'test ticket description');

-- The remaining tables will be populated during the game.
--------------------------------------------------------------------------------------------------





