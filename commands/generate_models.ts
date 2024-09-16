import { BaseCommand } from '@adonisjs/core/ace'
import { CommandOptions } from '@adonisjs/core/types/ace'
import Model from '../src/model/index.js'
import { schema } from '../src/db/schema.js'

export default class GenerateModels extends BaseCommand {
  static commandName = 'generate:models'
  static description = 'Generate model files from an existing database'

  static options: CommandOptions = {
    startApp: true,
  }

  async run() {
    const db = await this.app.container.make('lucid.db')
    const { tables } = await schema(db)
    const models = Model.build(tables)

    console.log({ models })
  }
}
