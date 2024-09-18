import string from '@adonisjs/core/helpers/string'
import { Column } from 'knex-schema-inspector/dist/types/column.js'
import RelationshipTypes from '../enums/relationship_types.js'
import { extractColumnTypeScriptType } from '../extractors/type_extractor.js'

export default class ModelColumn {
  declare name: string
  declare columnName: string
  declare tableName: string
  declare type: string
  declare typeDb: string
  declare isPrimary: boolean
  declare isNullable: boolean
  declare isDateTime: boolean
  declare foreignKeyTable: string | null
  declare foreignKeyColumn: string | null
  declare relationshipType: RelationshipTypes | null

  constructor(info: Column) {
    this.name = string.camelCase(info.name)
    this.type = extractColumnTypeScriptType(info.data_type)
    this.typeDb = info.data_type
    this.columnName = info.name
    this.tableName = info.table
    this.isPrimary = info.is_primary_key
    this.isNullable = info.is_nullable
    this.isDateTime = info.data_type.includes('timestamp') || info.data_type === 'date'
    this.foreignKeyTable = info.foreign_key_table
    this.foreignKeyColumn = info.foreign_key_column
  }

  /**
   * get the column decorator for the column's type
   * @returns 
   */
  getDecorator() {
    if (this.isPrimary) {
      return '@column({ isPrimary: true })'
    }

    if (this.type === 'DateTime' && this.name === 'createdAt') {
      return '@column.dateTime({ autoCreate: true })'
    }

    if (this.type === 'DateTime' && this.name === 'updatedAt') {
      return '@column.dateTime({ autoCreate: true, autoUpdate: true })'
    }

    if (this.type === 'DateTime') {
      return '@column.dateTime()'
    }

    return '@column()'
  }
}
