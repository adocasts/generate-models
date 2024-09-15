import string from '@adonisjs/core/helpers/string'
import RelationshipTypes from '../enums/relationship_types.js'
import type Model from './index.js'
import type ModelColumn from './column.js'

export default class ModelRelationship {
  declare foreignKey: string

  declare parentType: RelationshipTypes
  declare parentModelName: string
  declare parentModelColumn: string
  declare parentTableName: string
  declare parentTableColumn: string

  declare childType: RelationshipTypes
  declare childModelName: string
  declare childModelColumn: string
  declare childTableName: string
  declare childTableColumn: string

  constructor(type: RelationshipTypes, column: ModelColumn, tables: Model[]) {
    const isBelongsTo = type === RelationshipTypes.BELONGS_TO
    const local = tables.find((table) => table.tableName === column.tableName)
    const foreign = tables.find((table) => table.tableName === column.foreignKeyTable)

    const [parentTable, childTable] = isBelongsTo ? [foreign, local] : [local, foreign]
    const [parentColumn, childColumn] = isBelongsTo
      ? [column.foreignKeyColumn, column.columnName]
      : [column.columnName, column.foreignKeyColumn]

    this.foreignKey = `${column.foreignKeyTable}.${column.foreignKeyColumn}`

    this.parentTableName = parentTable!.tableName
    this.childTableName = childTable!.tableName

    this.parentTableColumn = parentColumn!
    this.childTableColumn = childColumn!

    this.parentModelName = parentTable!.name
    this.childModelName = childTable!.name

    this.parentModelColumn = this.#getModelColumn(parentTable!, this.parentTableColumn)
    this.childModelColumn = this.#getModelColumn(childTable!, this.childTableColumn)

    this.#setTypes(type, column, tables)
  }

  toDefinition() {
    // TODO
  }

  #getModelColumn(model: Model, tableColumnName: string) {
    return model.columns.find(({ columnName }) => columnName === tableColumnName)!.name
  }

  #setTypes(type: RelationshipTypes, column: ModelColumn, tables: Model[]) {
    const tableNamesSingular = tables
      .filter((table) => table.tableName !== column.tableName)
      .map((table) => string.singular(table.tableName))

    const tableNameSingular = string.singular(column.tableName)
    const startsWithTable = tableNamesSingular.find((name) => tableNameSingular.startsWith(name))
    const endsWithTable = tableNamesSingular.find((name) => tableNameSingular.endsWith(name))
    const pivotName = `${startsWithTable}_${endsWithTable}`

    // if start & end are both tables and their joined values match the current table
    // then, assume it's a many-to-many
    if (tableNameSingular === pivotName || type === RelationshipTypes.MANY_TO_MANY) {
      this.childType = RelationshipTypes.MANY_TO_MANY
      this.parentType = RelationshipTypes.MANY_TO_MANY
      return
    }

    // if relation is belongs to, assume the other side is has many
    // note: the difference between has one & has many cannot be determined
    // so we pick the more common and move on
    if (type === RelationshipTypes.BELONGS_TO) {
      this.childType = type
      this.parentType = RelationshipTypes.HAS_MANY
      return
    }

    // otherwise, child is likely belongs to
    this.parentType = type
    this.childType = RelationshipTypes.BELONGS_TO
  }

  static parse(models: Model[]) {
    const relationships = new Map<string, Map<string, ModelRelationship>>()

    models.map((model) => {
      model.columns.map((column) => {
        const relationship = column.getRelationship(models)

        if (!relationship) return

        const parent = relationships.get(relationship.parentModelName) ?? new Map()

        parent.set(relationship.foreignKey, relationship)
        relationships.set(relationship.parentModelName, parent)

        if (relationship.parentModelName === relationship.childModelName) return

        const child = relationships.get(relationship.childModelName) ?? new Map()

        child.set(relationship.foreignKey, relationship)
        relationships.set(relationship.childModelName, child)
      })
    })

    return relationships
  }
}
