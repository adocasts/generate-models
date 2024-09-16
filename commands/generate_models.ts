import { BaseCommand } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'
import Model from '../src/model/index.js'
import { schema } from '../src/db/schema.js'
import { stubsRoot } from '../stubs/main.js'

export default class GenerateModels extends BaseCommand {
  static commandName = 'generate:models'
  static description = 'Generate model files from an existing database'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    const codemods = await this.createCodemods()
    const db = await this.app.container.make('lucid.db')
    const { tables } = await schema(db)
    const models = Model.build(tables)

    for (let model of models) {
      await codemods.makeUsingStub(stubsRoot, 'generate/model.stub', { 
        model,
        relationships: model.relationships.reduce<{ decorator: string; property: string; }[]>((relationships, relationship) => {
          return [...relationships, ...relationship.getDefinitions(model.name)]
        }, [])
      })
    }
  }
}
