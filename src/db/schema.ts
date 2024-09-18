import { Database } from '@adonisjs/lucid/database'
import { default as schemaInspectorImport } from 'knex-schema-inspector'
import type { Column } from 'knex-schema-inspector/dist/types/column.js'
const schemaInspector = schemaInspectorImport.default

export type TableSchema = {
  name: string
  columns: Column[]
}

const ignoreTables = ['adonis_schema', 'adonis_schema_versions']

/**
 * parse schema information from the provided database connection
 * @param db 
 * @returns 
 */
export async function schema(db: Database) {
  const knex = db.connection().getWriteClient()
  const inspector = schemaInspector(knex)
  const tableNames = await inspector.tables()
  const targetTableNames = tableNames.filter((name) => !ignoreTables.includes(name))
  const promises = targetTableNames.map(async (name) => ({
    name,
    columns: await inspector.columnInfo(name),
  }))

  return Promise.all(promises)
}
