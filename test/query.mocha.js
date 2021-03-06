const { expect } = require('chai');
const { sane } = require('./utils.js');
const { exec } = require('child_process');

const druidHost = '192.168.99.100';

describe('query', () => {
  it('does basic query', (testComplete) => {
    exec(`bin/plyql -h ${druidHost} -q 'SELECT 1+1'`, (error, stdout, stderr) => {
      expect(error).to.equal(null);
      expect(stdout).to.contain(sane`
        ┌─────┐
        │ 1+1 │
        ├─────┤
        │ 2   │
        └─────┘
      `);
      expect(stderr).to.equal('');
      testComplete();
    });
  });

  it('does basic query with json output', (testComplete) => {
    exec(`bin/plyql -h ${druidHost} -o json -q 'SELECT 1+1'`, (error, stdout, stderr) => {
      expect(error).to.equal(null);
      expect(JSON.parse(stdout)).to.deep.equal([
        {
          "1+1": 2
        }
      ]);
      expect(stderr).to.equal('');
      testComplete();
    });
  });

  it('does a SELECT query', (testComplete) => {
    exec(`bin/plyql -h ${druidHost} -q 'SELECT page, SUM(count) AS 'Count' FROM wikipedia WHERE channel = "en" GROUP BY page ORDER BY Count DESC LIMIT 3;'`, (error, stdout, stderr) => {
      expect(error).to.equal(null);
      expect(stdout).to.contain(sane`
        ┌──────────────────────────────────────────────────────────┬───────┐
        │ page                                                     │ Count │
        ├──────────────────────────────────────────────────────────┼───────┤
        │ User:Cyde/List of candidates for speedy deletion/Subpage │ 255   │
        │ Jeremy Corbyn                                            │ 241   │
        │ Wikipedia:Administrators' noticeboard/Incidents          │ 228   │
        └──────────────────────────────────────────────────────────┴───────┘
      `);
      expect(stderr).to.equal('');
      testComplete();
    });
  });

  it('does a SELECT query with empty result', (testComplete) => {
    exec(`bin/plyql -h ${druidHost} -q 'SELECT page, SUM(count) AS 'Count' FROM wikipedia WHERE channel = "blah" GROUP BY page ORDER BY Count DESC LIMIT 3;'`, (error, stdout, stderr) => {
      expect(error).to.equal(null);
      expect(stdout).to.equal('\n');
      expect(stderr).to.equal('');
      testComplete();
    });
  });

  it('does a SHOW TABLES query', (testComplete) => {
    exec(`bin/plyql -h ${druidHost} -q 'SHOW TABLES' -o JSON`, (error, stdout, stderr) => {
      expect(error).to.equal(null);
      expect(JSON.parse(stdout)).to.deep.equal([
        {
          "Tables_in_database": "COLUMNS"
        },
        {
          "Tables_in_database": "SCHEMATA"
        },
        {
          "Tables_in_database": "TABLES"
        },
        {
          "Tables_in_database": "wikipedia"
        },
        {
          "Tables_in_database": "wikipedia-compact"
        }
      ]);
      expect(stderr).to.equal('');
      testComplete();
    });
  });

  it('does timezone conversion query', (testComplete) => {
    exec(`bin/plyql -h ${druidHost} -Z "America/Los_Angeles" -o json -q 'SELECT TIMESTAMP("2016-04-04T01:02:03") AS T'`, (error, stdout, stderr) => {
      expect(error).to.equal(null);
      expect(JSON.parse(stdout)).to.deep.equal([
        {
          "T": {
            "type": "TIME",
            "value": "2016-04-04T08:02:03.000Z"
          }
        }
      ]);
      expect(stderr).to.equal('');
      testComplete();
    });
  });

  it('passes in a custom druid context', (testComplete) => {
    exec(`bin/plyql -h ${druidHost} -v --druid-context '{"lol":1}' -q "SELECT COUNT(DISTINCT user_theta) FROM wikipedia";`, (error, stdout, stderr) => {
      expect(error).to.equal(null);
      expect(stdout).to.contain('"lol": 1');
      expect(stdout).to.contain(sane`
        ┌────────────────────────────┐
        │ COUNT(DISTINCT user_theta) │
        ├────────────────────────────┤
        │ 38164.49404386297          │
        └────────────────────────────┘

      `);
      expect(stderr).to.equal('');
      testComplete();
    });
  });

});
