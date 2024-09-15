import db from '@adonisjs/lucid/services/db'
import { default as schemaInspectorImport } from 'knex-schema-inspector'
import type { Column } from 'knex-schema-inspector/dist/types/column.js'
import type { SchemaInspector } from 'knex-schema-inspector/dist/types/schema-inspector.js'
const schemaInspector = schemaInspectorImport.default

export type TableSchema = {
  name: string
  columns: Column[]
}

export default class Schema {
  declare inspector: SchemaInspector

  constructor() {
    const knex = db.connection().getWriteClient()
    this.inspector = schemaInspector(knex)
  }

  async getTables(): Promise<TableSchema[]> {
    const tableNames = await this.inspector.tables()
    const promises = tableNames.map(async (name) => ({
      name,
      columns: await this.inspector.columnInfo(name),
    }))

    return Promise.all(promises)
  }
}
