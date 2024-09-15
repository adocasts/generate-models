import string from '@adonisjs/core/helpers/string'
import RelationshipTypes from '../enums/relationship_types.js'
import type Model from './index.js'
import type ModelColumn from './column.js'

export type ModelRelationshipInfo = {
  type: RelationshipTypes
  modelName: string
  modelColumn: string
  tableName: string
  tableColumn: string
}

export default class ModelRelationship {
  declare foreignKey: string
  declare parent: ModelRelationshipInfo
  declare child: ModelRelationshipInfo

  constructor(type: RelationshipTypes, column: ModelColumn, models: Model[]) {
    const isBelongsTo = type === RelationshipTypes.BELONGS_TO
    const local = models.find((model) => model.tableName === column.tableName)
    const foreign = models.find((model) => model.tableName === column.foreignKeyTable)

    const [parentModel, childModel] = isBelongsTo ? [foreign, local] : [local, foreign]
    const [parentColumn, childColumn] = isBelongsTo
      ? [column.foreignKeyColumn, column.columnName]
      : [column.columnName, column.foreignKeyColumn]

    this.foreignKey = `${column.foreignKeyTable}.${column.foreignKeyColumn}`

    this.parent = {
      type: type,
      tableName: parentModel!.tableName,
      tableColumn: parentColumn!,
      modelName: parentModel!.name,
      modelColumn: this.#getModelColumn(parentModel!, parentColumn!),
    }

    this.child = {
      type: type,
      tableName: childModel!.tableName,
      tableColumn: childColumn!,
      modelName: childModel!.name,
      modelColumn: this.#getModelColumn(childModel!, childColumn!),
    }

    this.#setTypes(type, column, models)
  }

  getDefinitions(modelName: string) {
    const definitions = []

    if (modelName === this.parent.modelName) {
      definitions.push(this.#getDefinition(this.parent))
    }

    if (modelName === this.child.modelName) {
      definitions.push(this.#getDefinition(this.child))
    }

    return definitions
  }

  #getDefinition(info: ModelRelationshipInfo) {
    return {
      decorator: `@${info.type}(() => ${info.modelName})`,
      property: `declare ${info.modelColumn}: ${string.capitalCase(info.type)}<typeof ${info.modelName}>`,
    }
  }

  #getModelColumn(model: Model, tableColumnName: string) {
    return model.columns.find(({ columnName }) => columnName === tableColumnName)!.name
  }

  #setTypes(type: RelationshipTypes, column: ModelColumn, models: Model[]) {
    const tableNamesSingular = models
      .filter((model) => model.tableName !== column.tableName)
      .map((model) => string.singular(model.tableName))

    const tableNameSingular = string.singular(column.tableName)
    const startsWithTable = tableNamesSingular.find((name) => tableNameSingular.startsWith(name))
    const endsWithTable = tableNamesSingular.find((name) => tableNameSingular.endsWith(name))
    const pivotName = `${startsWithTable}_${endsWithTable}`

    // if start & end are both tables and their joined values match the current table
    // then, assume it's a many-to-many
    if (tableNameSingular === pivotName || type === RelationshipTypes.MANY_TO_MANY) {
      this.child.type = RelationshipTypes.MANY_TO_MANY
      this.parent.type = RelationshipTypes.MANY_TO_MANY
      return
    }

    // if relation is belongs to, assume the other side is has many
    // note: the difference between has one & has many cannot be determined
    // so we pick the more common and move on
    if (type === RelationshipTypes.BELONGS_TO) {
      this.child.type = type
      this.parent.type = RelationshipTypes.HAS_MANY
      return
    }

    // otherwise, child is likely belongs to
    this.parent.type = type
    this.child.type = RelationshipTypes.BELONGS_TO
  }

  static parse(models: Model[]) {
    const relationships = new Map<string, Map<string, ModelRelationship>>()

    models.map((model) => {
      model.columns.map((column) => {
        const relationship = column.getRelationship(models)

        if (!relationship) return

        const parent = relationships.get(relationship.parent.modelName) ?? new Map()

        parent.set(relationship.foreignKey, relationship)
        relationships.set(relationship.parent.modelName, parent)

        if (relationship.parent.modelName === relationship.child.modelName) return

        const child = relationships.get(relationship.child.modelName) ?? new Map()

        child.set(relationship.foreignKey, relationship)
        relationships.set(relationship.child.modelName, child)
      })
    })

    return relationships
  }
}
