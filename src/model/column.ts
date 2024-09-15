import string from '@adonisjs/core/helpers/string'
import { Column } from 'knex-schema-inspector/dist/types/column.js'
import RelationshipTypes from '../enums/relationship_types.js'
import Model from './index.js'
import ModelRelationship from './relationship.js'

export default class ModelColumn {
  declare name: string
  declare columnName: string
  declare tableName: string
  declare type: string // TODO - potential reference: https://github.com/danvk/pg-to-ts/blob/master/src/schemaPostgres.ts
  declare isPrimary: boolean
  declare isNullable: boolean
  declare isDateTime: boolean
  declare foreignKeyTable: string | null
  declare foreignKeyColumn: string | null
  declare relationshipType: RelationshipTypes | null

  constructor(info: Column) {
    this.name = string.camelCase(info.name)
    this.columnName = info.name
    this.tableName = info.table
    this.isPrimary = info.is_primary_key
    this.isNullable = info.is_nullable
    this.isDateTime = info.data_type.includes('timestamp') || info.data_type === 'date'
    this.foreignKeyTable = info.foreign_key_table
    this.foreignKeyColumn = info.foreign_key_column
  }

  get isIdColumn() {
    return this.columnName.endsWith('_id')
  }

  getRelationship(tables: Model[]) {
    if (!this.isIdColumn || !this.foreignKeyColumn) return

    // mark id columns with a foreign key as a belongs to
    const type = RelationshipTypes.BELONGS_TO

    return new ModelRelationship(type, this, tables)
  }
}
