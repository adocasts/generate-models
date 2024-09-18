/**
 * Database Type to TypeScript Type Extractor
 * TODO: Add support for MSSql and other missing Lucid Db Drivers
 *
 * Based on ehmpathy/sql-code-generator:
 * https://github.com/ehmpathy/sql-code-generator/blob/main/src/logic/sqlToTypeDefinitions/resource/common/extractDataTypeFromColumnOrArgumentDefinitionSql.ts
 */

// #region Strings

// https://dev.mysql.com/doc/refman/8.0/en/string-types.html
const mysqlStringTypes = [
  'CHAR',
  'VARCHAR',
  'BLOB',
  'TEXT',
  'TINYTEXT',
  'MEDIUMTEXT',
  'LONGTEXT',
  'ENUM',
  'SET',
]

//www.postgresql.org/docs/9.5/datatype-character.html
const pgStringTypes = ['CHARACTER', 'CHAR', 'CHARACTER VARYING', 'VARCHAR', 'TEXT', 'UUID']

const dbStringTypes = new Set([...mysqlStringTypes, ...pgStringTypes])

// #endregion
// #region Numbers

// https://dev.mysql.com/doc/refman/8.0/en/numeric-types.html
const mysqlNumberTypes = [
  'INTEGER',
  'INT',
  'SMALLINT',
  'TINYINT',
  'MEDIUMINT',
  'BIGINT',
  'DECIMAL',
  'NUMERIC',
  'FLOAT',
  'DOUBLE',
]

// https://www.postgresql.org/docs/9.5/datatype-numeric.html
const pgNumberTypes = [
  'SMALLINT',
  'INT2',
  'INTEGER',
  'INT',
  'INT4',
  'BIGINT',
  'INT8',
  'DECIMAL',
  'NUMERIC',
  'REAL',
  'DOUBLE PRECISION',
  'FLOAT8',
  'SMALLSERIAL',
  'SERIAL2',
  'SERIAL',
  'SERIAL4',
  'BIGSERIAL',
  'SERIAL8',
]

const dbNumberTypes = new Set([...mysqlNumberTypes, ...pgNumberTypes])

// #endregion
// #region Dates

// https://dev.mysql.com/doc/refman/8.0/en/date-and-time-types.html
const mysqlDateTypes = ['DATE', 'TIME', 'DATETIME', 'TIMESTAMP', 'YEAR']

// https://www.postgresql.org/docs/9.5/datatype-datetime.html
const pgDateTypes = [
  'TIMESTAMP',
  'TIMESTAMPTZ',
  'TIMESTAMP WITH TIME ZONE',
  'DATE',
  'TIME',
  'TIMETZ',
  'TIME WITH TIMEZONE',
]

const dbDateTypes = new Set([...mysqlDateTypes, ...pgDateTypes])

// #endregion
// #region Binary

// https://dev.mysql.com/doc/refman/8.0/en/binary-varbinary.html
const mysqlBinaryTypes = ['BINARY', 'VARBINARY']

// https://www.postgresql.org/docs/9.5/datatype-binary.html
const pgBinaryTypes = ['BYTEA']

const dbBinaryTypes = new Set([...mysqlBinaryTypes, ...pgBinaryTypes])

// #endregion
// #region Booleans

// https://dev.mysql.com/doc/refman/8.1/en/numeric-type-syntax.html
const mysqlBooleanTypes = ['BOOL', 'BOOLEAN']

// https://www.postgresql.org/docs/9.5/datatype-boolean.html
const pgBooleanTypes = ['BOOLEAN']

const dbBooleanTypes = new Set([...mysqlBooleanTypes, ...pgBooleanTypes])

// #endregion
// #region JSON

// https://dev.mysql.com/doc/refman/8.0/en/json.html
const mysqlJsonTypes = ['JSON']

// https://www.postgresql.org/docs/9.5/datatype-json.html
const pgJsonTypes = ['JSON', 'JSONB']

const dbJsonTypes = new Set([...mysqlJsonTypes, ...pgJsonTypes])

// #endregion

/**
 * extract the TypeScript type from the database type
 * @param dbDataType
 * @returns
 */
export function extractColumnTypeScriptType(dbDataType: string) {
  const isArray = dbDataType.endsWith('[]')
  const normalizedDbType = dbDataType.toUpperCase().split('[]')[0].trim()

  if (dbStringTypes.has(normalizedDbType)) return isArray ? 'string[]' : 'string'
  if (dbNumberTypes.has(normalizedDbType)) return isArray ? 'number[]' : 'number'
  if (dbDateTypes.has(normalizedDbType)) return 'DateTime'
  if (dbBinaryTypes.has(normalizedDbType)) return 'Buffer'
  if (dbBooleanTypes.has(normalizedDbType)) return 'boolean'
  if (dbJsonTypes.has(normalizedDbType)) return 'Record<string, any>'

  return 'unknown'
}
