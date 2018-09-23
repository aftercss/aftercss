import { BaseFixture } from './../../base-framework/base-fixture';
import assert from 'assert';

class TokenFixture extends BaseFixture{
  async build(taskName, dir){

  }
}

describe('token-fixture',()=>{
  const fixture = new TokenFixture(__dirname);
})