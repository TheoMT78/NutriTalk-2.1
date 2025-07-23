import { detectModificationIntent } from '../src/utils/detectModification';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const examples = [
  {
    msg: "modifie car ce matin au lieu de 2 oeufs j'en ai mangé qu'un",
    meal: 'petit-déjeuner',
    newQ: 1,
    oldQ: 2,
  },
  {
    msg: "remplace les 2 oeufs par 1 seul",
    meal: 'déjeuner',
    newQ: 1,
    oldQ: 2,
  },
  {
    msg: "finalement j’ai mangé qu’un œuf ce matin",
    meal: 'petit-déjeuner',
    newQ: 1,
  },
];

for (const ex of examples) {
  test(ex.msg, async () => {
    const res = await detectModificationIntent(ex.msg);
    assert(res);
    assert.equal(res?.meal, ex.meal);
    assert.equal(res?.newQuantity, ex.newQ);
    if (ex.oldQ) assert.equal(res?.oldQuantity, ex.oldQ);
  });
}

