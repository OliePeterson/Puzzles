BBTRIO = {};
Object.assign(BBTRIO, BLUEBERRY);
BBTRIO.createModel = (desc) => {
    const options = { hideRowColumnBlockClues:true };
    const model = BLUEBERRY.createModel(desc, options);
    const s = BBTRIO.solutions[desc];
    if (desc.solution !== undefined) {
        model.solutionState = BBTRIO.unstringifyState(model, desc.solution);
    } else if (s !== undefined) {
        // TODO:jkd remove
        model.solutionState = BBTRIO.unstringifyState(model, s);
    } else {
        // XXX:jkd remove
        const state1 = BBTRIO.createInitialState(model);
        const soln = BBTRIO.solve.trySolvePuzzle(model, state1, "Advanced");
        model.solutionState = state1;
    }
    return model;
};
