import RelationshipTypes from "../enums/relationship_types.js";
import ModelColumn from "../model/column.js";
import Model from "../model/index.js";
import string from '@adonisjs/core/helpers/string';

type RelationMap = {
  type: RelationshipTypes
  model: Model
  column: ModelColumn
  foreignKeyModel: Model
  foreignKeyColumn: ModelColumn
  pivotColumnName?: string
  pivotTableName?: string
}

type DecoratorOptions = {
  localKey?: string
  foreignKey?: string
  pivotForeignKey?: string
  relatedKey?: string
  pivotRelatedForeignKey?: string
  pivotTable?: string
}

export class ModelRelationship {
  declare type: RelationshipTypes
  declare propertyName: string
  declare modelName: string
  declare relatedModelName: string
  declare decoratorOptions: DecoratorOptions | undefined
  declare map: RelationMap
  
  declare decorator: string
  declare property: string

  constructor(relationMap: RelationMap) {
    this.type = relationMap.type
    this.propertyName = this.#getPropertyName(relationMap)
    this.decoratorOptions = this.#getDecoratorOptions(relationMap)
    this.modelName = relationMap.model.name
    this.relatedModelName = relationMap.foreignKeyModel.name
    this.map = relationMap

    const definition = this.#getDefinition()

    this.decorator = definition.decorator
    this.property = definition.property
  }

  /**
   * gets property name for the relationship definition
   * @param relationMap 
   * @returns 
   */
  #getPropertyName(relationMap: RelationMap) {
    let propertyName = string.camelCase(relationMap.foreignKeyModel.name)

    switch (relationMap.type) {
      case RelationshipTypes.BELONGS_TO:
        return string.camelCase(relationMap.column.name.replace('Id', ''))
      case RelationshipTypes.HAS_MANY:
        return string.plural(propertyName)
      case RelationshipTypes.MANY_TO_MANY:
        return string.plural(string.camelCase(relationMap.foreignKeyModel.name))
    }

    return propertyName
  }

  /**
   * gets the relationship's decorator options (if needed)
   * @param relationMap 
   * @returns 
   */
  #getDecoratorOptions(relationMap: RelationMap): DecoratorOptions | undefined {
    switch (relationMap.type) {
      case RelationshipTypes.MANY_TO_MANY:
        const defaultPivotName = string.snakeCase([relationMap.model.name, relationMap.foreignKeyModel.name].sort().join('_'))

        if (relationMap.pivotTableName === defaultPivotName) return

        return {
          pivotTable: relationMap.pivotTableName,
        }
      case RelationshipTypes.BELONGS_TO:
        const defaultBelongsName = string.camelCase(relationMap.foreignKeyModel.name + 'Id')

        if (relationMap.column.name === defaultBelongsName) return

        return {
          foreignKey: relationMap.column.name
        }
      case RelationshipTypes.HAS_MANY:
      case RelationshipTypes.HAS_ONE:
        const defaultHasName = string.camelCase(relationMap.model.name + 'Id')

        if (relationMap.foreignKeyColumn.name === defaultHasName) return
        
        return {
          foreignKey: relationMap.foreignKeyColumn.name
        }
    }
  }

  /**
   * converts the populated decorator options into a string for the stub
   * @returns 
   */
  #getDecoratorString() {
    const keys = Object.keys(this.decoratorOptions || {}) as Array<keyof DecoratorOptions>
    
    if (!keys.length) return ''

    const inner = keys.reduce((str, key) => {
      if (str.length) str += ', '
      str += `${key}: '${this.decoratorOptions![key]}'`
      return str
    }, '')

    return inner ? `, { ${inner} }` : ''
  }

  /**
   * gets definition decorator and property definition lines for the stub
   * @returns 
   */
  #getDefinition() {
    return {
      decorator: `@${this.type}(() => ${this.relatedModelName}${this.#getDecoratorString()})`,
      property: `declare ${this.propertyName}: ${string.pascalCase(this.type)}<typeof ${this.relatedModelName}>`
    }
  }
}

export default class ModelRelationshipManager {

  constructor(protected models: Model[]) {}

  /**
   * extract relationships from the loaded models
   * @returns 
   */
  extract() {
    const relationshpMaps = this.#getRelationshipMaps()
    return relationshpMaps.map((map) => new ModelRelationship(map))
  }

  /**
   * get mappings for the model's relationships with information 
   * needed to populate their definitions
   * @returns 
   */
  #getRelationshipMaps() {
    const belongsTos = this.#getBelongsTos()
    const relationships: RelationMap[] = []
    
    belongsTos.map((belongsTo) => {
      const tableNamesSingular = this.models
        .filter((model) => model.tableName !== belongsTo.column.tableName)
        .map((model) => ({ singular: string.singular(model.tableName), model }))

      // try to build a pivot table by matching table names with the current table name
      const tableNameSingular = string.singular(belongsTo.column.tableName)
      const startsWithTable = tableNamesSingular.find((name) => tableNameSingular.startsWith(name.singular))
      const endsWithTable = tableNamesSingular.find((name) => tableNameSingular.endsWith(name.singular))
      const pivotName = `${startsWithTable?.singular}_${endsWithTable?.singular}`

      // if they match, consider it a pivot and build a many-to-many relationship from the belongsTo info
      if (tableNameSingular === pivotName) {
        const isStartsWith = startsWithTable?.model.name === belongsTo.foreignKeyModel.name
        const relatedModel = isStartsWith ? endsWithTable!.model : startsWithTable!.model
        const relatedColumn = isStartsWith
          ? relatedModel.columns.find((column) => column.tableName === endsWithTable?.model.tableName)
          : relatedModel.columns.find((column) => column.tableName === startsWithTable?.model.tableName)

        // mark the model as a pivot, so it can be ignored
        belongsTo.model.isPivotTable = true

        relationships.push({
          type: RelationshipTypes.MANY_TO_MANY,
          model: belongsTo.foreignKeyModel,
          column: belongsTo.foreignKeyColumn,
          foreignKeyModel: relatedModel!,
          foreignKeyColumn: relatedColumn!,
          pivotColumnName: belongsTo.column.columnName,
          pivotTableName: belongsTo.model.tableName,
        })

        return
      }

      // otherwise, it'll be a has many ... it may also be a has one, but
      // we have no way to discern that, so we'll default to has many
      relationships.push({
        type: RelationshipTypes.HAS_MANY,
        model: belongsTo.foreignKeyModel,
        column: belongsTo.foreignKeyColumn,
        foreignKeyModel: belongsTo.model,
        foreignKeyColumn: belongsTo.column,
      })

      // tag along the belongs to when it is not converted to a many-to-many
      relationships.push(belongsTo)
    })

    return relationships
  }

  /**
   * get the belongs to relationships from the foreign key definitions on the models
   * we'll work backwards from here
   * @returns 
   */
  #getBelongsTos() {
    const belongsTos: RelationMap[] = []

    this.models.map((model) => {
      model.columns.map((column) => {
        if (!column.foreignKeyTable) return

        const foreignKeyModel = this.models.find((m) => m.tableName === column.foreignKeyTable)
        const foreignKeyColumn = foreignKeyModel?.columns.find((c) => column.foreignKeyColumn === c.columnName)

        if (!foreignKeyColumn || !foreignKeyModel) return

        belongsTos.push({
          type: RelationshipTypes.BELONGS_TO,
          model,
          column,
          foreignKeyModel,
          foreignKeyColumn,
        })
      })
    })

    return belongsTos
  }
}
