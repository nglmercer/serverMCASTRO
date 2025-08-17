import BaseApi from './commons/BaseApi';
import type { FetchOptions } from './commons/httpservice';
import apiConfig from './config/apiConfig';
class ConfigApi extends BaseApi {
    constructor(config: any) {
      super(config);
    }
    //app.route('/config',configRouter); ---> path and get

    async getConfig(){
      return this.get<string[]>(`/config`);
    }
  
    async setConfig(data:Record<string, any>): Promise<string | false> {
        return this.patch(`/config`,data)
    }
  }
interface ModelList {
  openai: {
    models: string[];
  }
  anthropic: {
    models: string[];
  }
  google: {
    models: string[];
  }
  deepseek: {
    models: string[];
  }
}
  class AImodel extends BaseApi {
    constructor(config: any) {
      super(config);
    }
    ///api/providers
    //get models
    getRoute(string:string){
      return `/api/providers/${string}`;
    }

    async getModels(){
      return this.get<{succes:boolean,data:ModelList}>(this.getRoute('models'));
    }
    async getProvidersChat(){
      return this.get<string[]>(this.getRoute('chat'));
    }
    async getAllProviders(){
      return this.get<string[]>(this.getRoute('all'));

    }
  }

  const configApi = new ConfigApi(apiConfig);
  const aiModel = new AImodel(apiConfig);
  async function test() {
      const models = await aiModel.getModels();
      console.log("models",models);
  }

  test();
  export {
    configApi,
    aiModel,
    type ModelList
  }