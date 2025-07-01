BLUEBERRY = {};
BLUEBERRY.settings = [
    { id: "autoCheck", text: "Check", kind: "choice", values: ["Auto", "Manual"], defaultValue: "Auto" },
    // { id: "style", text: "Style", kind: "choice", values: ["A", "B"], defaultValue: "A" },
];
BLUEBERRY.enableAutoCheckSolved = true;
BLUEBERRY.createModel = (desc_, options) => {
    if (options == undefined) {
        options = { 
            hideRowColumnBlockClues: false, 
            pairRuleEnabled: false,
        };
    }
    const desc = JSON.parse(desc_);
    const grid = PUZZLEUTIL.model.createGrid(desc.size.rows, desc.size.columns);
    const allGroups = [];
    const cellsOfGroup = [];
    const blocks = {};
    const blockFromCell = {};
    const cellsOfBlock = {};
    for (let r = 0; r < grid.numRows; ++r) {
        allGroups.push(`R${r + 1}`);
    }
    for (let c = 0; c < grid.numColumns; ++c) {
        allGroups.push(`C${c + 1}`);
    }
    let numBlocks = 0;
    for (let r = 0; r < grid.numRows; ++r) {
        for (let c = 0; c < grid.numColumns; ++c) {
            const cell = grid.cellInRowColumn(r + 1, c + 1);
            const index = c + r * grid.numColumns;
            const b = desc.blocks[index];
            if (b + 1 >= numBlocks) {
                numBlocks = b + 1;
            }
            const block = `B${b + 1}`;
            blockFromCell[cell] = block;
            blocks[block] = true;
            if (cellsOfBlock[block] == undefined) {
                cellsOfBlock[block] = {};
            }
            cellsOfBlock[block][cell] = true;
        }
    }
    for (let b = 0; b < numBlocks; ++b) {
        allGroups.push(`B${b + 1}`);
    }
    allGroups.forEach(group => {
        cellsOfGroup[group] = {};
    });
    Object.keys(grid.cells).forEach(cell => {
        cellsOfGroup[grid.rowOfCell[cell]][cell] = true;
        cellsOfGroup[grid.columnOfCell[cell]][cell] = true;
        cellsOfGroup[blockFromCell[cell]][cell] = true;
    });
    const clueFromCell = {};
    const clueFromGroup = {};
    desc.rowClues.forEach((clue, r) => {
        if (typeof(clue) == "number") {
            const row = `R${r + 1}`;
            clueFromGroup[row] = clue;
        }
    });
    desc.columnClues.forEach((clue, c) => {
        if (typeof(clue) == "number") {
            const column = `C${c + 1}`;
            clueFromGroup[column] = clue;
        }
    });
    desc.blockClues.forEach((clue, blockIndex) => {
        if (typeof(clue) == "number") {
            const block = `B${blockIndex + 1}`;
            clueFromGroup[block] = clue;
        }
    });
    const cellFromNumberGroup = {};
    if (desc.cellClues != undefined) {
        desc.cellClues.forEach((clue, cellIndex) => {
            if (typeof(clue) == "number") {
                const r = Math.floor(cellIndex / grid.numColumns);
                const c = Math.floor(cellIndex % grid.numColumns);
                const cell = `R${r + 1}C${c + 1}`;
                clueFromCell[cell] = clue;
                const group = `N-${cell}`;
                allGroups.push(group);
                cellsOfGroup[group] = {};
                clueFromGroup[group] = clue;
                cellFromNumberGroup[group] = cell;
                const neighbors = grid.orthogonalAndDiagonalNeighborsOfCell[cell];
                Object.keys(neighbors).forEach(neighbor => {
                    cellsOfGroup[group][neighbor] = true;
                });
                cellsOfGroup[group][cell] = true;
            }
        });
    }
    const groupsFromCell = {};
    Object.keys(grid.cells).forEach(cell => {
        groupsFromCell[cell] = {};
    });
    allGroups.forEach(group => {
        const cells = cellsOfGroup[group];
        Object.keys(cells).forEach(cell => {
            groupsFromCell[cell][group] = true;
        });
    });
    const isTrio = options.hideRowColumnBlockClues;
    const model = { 
        grid, 
        allGroups, 
        blockFromCell, 
        cellsOfBlock, 
        cellsOfGroup, 
        clueFromCell, 
        clueFromGroup, 
        groupsFromCell,
        cellFromNumberGroup, 
        options, 
        isTrio
    };
    if (desc.solution !== undefined) {
        model.solutionState = BLUEBERRY.unstringifyState(model, desc.solution);
    }
    if (model.solutionState === undefined) {
        // XXX:jkd remove
        const state1 = BLUEBERRY.createInitialState(model);
        const soln = BLUEBERRY.solve.trySolvePuzzle(model, state1, "Advanced");
        model.solutionState = state1;
    }
    return model;
};
BLUEBERRY.descFromModel = (model) => {
    let desc = {};
    desc.size = {rows: model.grid.numRows, columns: model.grid.numColumns};
    desc.rowClues = [];
    desc.columnClues = [];
    desc.blockClues = [];
    for (let r = 1; r <= model.grid.numRows; r += 1) {
        const group = `R${r}`;
        const clue = model.clueFromGroup[group];
        desc.rowClues.push(clue === undefined ? null : clue);
    }
    for (let c = 1; c <= model.grid.numColumns; c += 1) {
        const group = `C${c}`;
        const clue = model.clueFromGroup[group];
        desc.columnClues.push(clue === undefined ? null : clue);
    }
    for (let b = 1; /**/; b += 1) {
        const group = `B${b}`;
        if (model.cellsOfBlock[group] === undefined) {
            break;
        }
        const clue = model.clueFromGroup[group];
        desc.blockClues.push(clue === undefined ? null : clue);
    }
    desc.blocks = [];
    Object.keys(model.grid.cells).forEach(cell => {
        const block = model.blockFromCell[cell];
        const blockNumber = Number(block.slice(1));
        desc.blocks.push(blockNumber - 1);
    });
    desc.cellClues = [];
    Object.keys(model.grid.cells).forEach(cell => {
        const clue = model.clueFromCell[cell];
        desc.cellClues.push(clue === undefined ? null : clue);
    });
    {
        const state = BLUEBERRY.createInitialState(model);
        BLUEBERRY.solve.trySolvePuzzle(model, state, "Advanced");
        const check = BLUEBERRY.checkSolved(model, state);
        console.assert(check.status === "solved");
        if (check.status === "solved") {
            desc.solution = BLUEBERRY.stringifyState(model, state);
        }
    }
    return JSON.stringify(desc);
};
BLUEBERRY.createInitialState = (model) => {
    const state = { cells: {} };
    Object.keys(model.grid.cells).forEach(cell => {
        if (model.clueFromCell[cell] != undefined) {
            state.cells[cell] = "x";
        } else {
            state.cells[cell] = "_";
        }
    });
    return state;
};
BLUEBERRY.doCommand = (model, state, view, command) => {
    const [cell, s1, s2] = command;
    if (view === undefined) {
        state.cells[cell] = s2;
    } else {
        const visuals1 = BLUEBERRY.calcVisuals(view);
        state.cells[cell] = s2;
        const visuals2 = BLUEBERRY.calcVisuals(view);
        BLUEBERRY.refreshView(view);
        BLUEBERRY.animateBetweenVisuals(view, visuals1, visuals2, /*enableErrorDelay=*/true);
    }
    {
    }
};
BLUEBERRY.undoCommand = (model, state, view, command) => {
    const [cell, s1, s2] = command;
    BLUEBERRY.doCommand(model, state, view, [cell, s2, s1]);
};
BLUEBERRY.checkSolved = (model, state) => {
    const errorGroups = {};
    const satisfiedGroups = {};
    const satisfied2Groups = {};
    model.allGroups.forEach(group => {
        const clue = model.clueFromGroup[group];
        if (clue == undefined) {
            satisfiedGroups[group] = true;
        } else {
            let cellsInGroup;
            if (group.startsWith("R")) {
                cellsInGroup = model.grid.cellsOfRow[group];
            } else if (group.startsWith("C")) {
                cellsInGroup = model.grid.cellsOfColumn[group];
            } else if (group.startsWith("B")) {
                cellsInGroup = model.cellsOfBlock[group];
            } else if (group.startsWith("N")) {
                cellsInGroup = model.cellsOfGroup[group];
            }
            const countsByState = PUZZLEUTIL.model.countCellsByState(cellsInGroup, state.cells, ["_", "x", "o"]);
            const error = (countsByState["o"] + countsByState["_"] < clue || countsByState["o"] > clue);
            const satisfied = (countsByState["o"] == clue);
            if (error) {
                errorGroups[group] = true;
            }
            if (satisfied) {
                satisfiedGroups[group] = true;
            }
            if (satisfied && countsByState["_"] == 0) {
                satisfied2Groups[group] = true;
            }
        }
    });
    const errorCells = {};
    Object.keys(errorGroups).forEach(group => {
        const cells = model.cellsOfGroup[group];
        Object.keys(cells).forEach(cell => {
            errorCells[cell] = true;
        });
    });
    // if (model.options.pairRuleEnabled) {
    //     const info = PUZZLEUTIL.model.findIslands(
    //         model.grid.cells, 
    //         (cell1, cell2) => {
    //             const cellState1 = state.cells[cell1];
    //             const cellState2 = state.cells[cell2];
    //             const isBerry1 = cellState1 === "o";
    //             const isBerry2 = cellState2 === "o";
    //             return isBerry1 === isBerry2;
    //         },
    //         model.grid.orthogonalNeighborsOfCell
    //     );
    //     Object.entries(info.cellsOfIsland).forEach(([island, cells]) => {
    //         const cellsK = Object.keys(cells);
    //         if (cellsK.length > 0 && state.cells[cellsK[0]] === "o") {
    //             if (cellsK.length === 1) {
    //                 const cell = cellsK[0];
    //                 const neighbors = Object.keys(model.grid.orthogonalNeighborsOfCell[cell]);
    //                 const numUndecidedNeighbors = neighbors.reduce(
    //                     (count, neighbor) => {
    //                         if (state.cells[neighbor] === "_") {
    //                             count += 1;
    //                         }
    //                         return count;
    //                     }, 
    //                     0
    //                 );
    //                 if (numUndecidedNeighbors === 0) {
    //                     errorCells[cell] = true;
    //                 }
    //             } else if (cellsK.length > 2) {
    //                 cellsK.forEach(cell => { errorCells[cell] = true; });
    //             }
    //         }
    //     });
    // }
    let numUnpaired = 0;
    if (model.options.pairRuleEnabled) {
        Object.keys(model.grid.cells).forEach(cell => {
            if (state.cells[cell] === "o") {
                const neighbors = model.grid.orthogonalNeighborsOfCell[cell];
                const counts = PUZZLEUTIL.model.countCellsByState(neighbors, state.cells, ["_", "x", "o"]);
                if (counts["o"] !== 1) {
                    numUnpaired += 1;
                    if (counts["o"] > 1) {
                        errorCells[cell] = true;
                    }
                    if (counts["o"] === 0 && counts["_"] === 0) {
                        errorCells[cell] = true;
                    }
                }
            }
        });
    }
    const countsByState = PUZZLEUTIL.model.countCellsByState(model.grid.cells, state.cells, ["_", "x", "o"]);
    const isError = (Object.keys(errorCells).length > 0);
    const isComplete = (Object.keys(satisfiedGroups).length == model.allGroups.length) && numUnpaired === 0;
    const status = isError ? "error" : isComplete ? "solved" : "ok";
    const compareWithSolution = model.solutionState === undefined 
        ? undefined 
        : PUZZLEUTIL.model.compareCellStatesToSolution(model.grid.cells, state.cells, model.solutionState.cells);
    return { status, compareWithSolution, errorGroups, errorCells, satisfiedGroups, satisfied2Groups, countsByState };
};
BLUEBERRY.stringifyState = (model, state) => {
    return PUZZLEUTIL.model.stringifyCellStates(model.grid.cells, state.cells);
};
BLUEBERRY.unstringifyState = (model, string) => {
    const state = {}
    state.cells = PUZZLEUTIL.model.unstringifyCellStates(model.grid.cells, string);
    return state;
};
BLUEBERRY.getPuzzleId = (desc) => {
    return desc;
};
BLUEBERRY.createView = (model, state, scale, isSolution) => {
    if (scale === undefined) { scale = 1; }
    const cellSize = 40;
    const numExtraRows = model.options.hideRowColumnBlockClues ? 0 : 1;
    const numExtraColumns = model.options.hideRowColumnBlockClues ? 0 : 1;
    const width = cellSize * (model.grid.numColumns + numExtraColumns) + 10;
    const height = cellSize * (model.grid.numRows + numExtraRows)      + 10;
    const offsetX = model.options.hideRowColumnBlockClues ? 0 : -15;
    const offsetY = model.options.hideRowColumnBlockClues ? 0 : -10;
    const svg = PUZZLEUTIL.view.createSvg(width, height, scale);
    const view = {};
    view.animator = PUZZLEUTIL.view.createAnimator();
    view.root = svg;
    view.svg = svg;
    view.model = model;
    view.state = state;
    { // clues outside the board
        view.grid2 = PUZZLEUTIL.view.createGrid(svg, model.grid.numRows, 1, cellSize, false, false, [0 + offsetX, cellSize + offsetY]);
        view.numbersLeft = PUZZLEUTIL.view.createText(svg, view.grid2, "fill: var(--theme-text);");
        view.grid3 = PUZZLEUTIL.view.createGrid(svg, 1, model.grid.numColumns, cellSize, false, false, [cellSize + offsetX, 0 + offsetY]);
        view.numbersAbove = PUZZLEUTIL.view.createText(svg, view.grid3, "fill: var(--theme-text);");
        if (model.options.hideRowColumnBlockClues) {
        } else {
            for (let r = 0; r < model.grid.numRows; ++r) {
                const row = `R${r + 1}`;
                const clue = model.clueFromGroup[row];
                if (clue != undefined) {
                    view.numbersLeft[`${row}C1`].textContent = `${clue}`;
                }
            }
            for (let c = 0; c < model.grid.numColumns; ++c) {
                const column = `C${c + 1}`;
                const clue = model.clueFromGroup[column];
                if (clue != undefined) {
                    view.numbersAbove[`R1${column}`].textContent = `${clue}`;
                }
            }
        }
    }
    const thinLineStyle = "stroke: var(--theme-blueberry-grid-lines-thin); opacity:100%;";
    view.grid = PUZZLEUTIL.view.createGrid(
        svg, 
        model.grid.numRows, 
        model.grid.numColumns, 
        cellSize, 
        true, 
        true, 
        model.options.hideRowColumnBlockClues 
            ? [2 + offsetX, 2 + offsetY] 
            : [cellSize + offsetX, cellSize + offsetY], thinLineStyle
    );
    view.edgesOutline = PUZZLEUTIL.view.createEdges(svg, view.grid, "stroke: white; stroke-width: 4pt;");
    PUZZLEUTIL.view.refreshEdges(view.svg, view.edgesOutline, (a, b) => {
        return (a === undefined) !== (b === undefined);
    });
    view.edges = PUZZLEUTIL.view.createEdges(svg, view.grid, "stroke-width: 2pt; stroke: var(--theme-blueberry-block-outline);");
    view.numbers = PUZZLEUTIL.view.createText(svg, view.grid, "");
    view.numbersCorner = PUZZLEUTIL.view.createTextCorner(svg, view.grid, "");
    const berryColor = model.options.pairRuleEnabled ? "var(--theme-blueberry-cherry)" : "var(--theme-blueberry-berry)";
    const maybeCircleColor =  "var(--theme-blueberry-dot)";
    view.berryRadius = cellSize * 0.20;
    view.berryCircles = PUZZLEUTIL.view.createCircles(svg, view.grid, view.berryRadius, `fill: ${berryColor};`);
    view.maybeCircles = PUZZLEUTIL.view.createCircles(svg, view.grid, cellSize * 0.07, `fill: ${maybeCircleColor};`);
    view.blackout = PUZZLEUTIL.view.createRects(svg, view.grid, "visibility: hidden;");
    view.blackout.g.style["opacity"] = "70%";
    Object.entries(model.clueFromCell).forEach(([cell, clue]) => {
        const e = view.numbers[cell];
        e.textContent = `${clue}`;
        const rect = view.grid.cells[cell].e;
        rect.style.pointerEvents = "none";
    });
    const cellOfBlockClue = {};
    view.cellOfBlockClue = cellOfBlockClue;
    if (model.options.hideRowColumnBlockClues) {
    } else {
        Object.keys(model.grid.cells).forEach(cell => {
            const block = model.blockFromCell[cell];
            if (cellOfBlockClue[block] == undefined) {
                cellOfBlockClue[block] = cell;
                const text = view.numbersCorner[cell];
                const clue = model.clueFromGroup[block];
                if (clue != undefined) {
                    text.textContent = `${clue}`;
                }
            }
        });
    }
    const noninteractiveFromCell = mapObject(model.grid.cells, cell => model.clueFromCell[cell] !== undefined);
    PUZZLEUTIL.view.setGridDownDragUpListenersToCycleCellState(view, view.grid, ["_", "x", "o"], noninteractiveFromCell);
    PUZZLEUTIL.view.setDefaultSettings(view, BLUEBERRY.settings);
    if (isSolution) {
        view.settingsValues["autoCheck"] = "Manual";
    }
    return view;
};
BLUEBERRY.refreshView = (view) => {
    // {
    //     const root = document.querySelector(":root");
    //     root.classList.remove("style-A");
    //     root.classList.remove("style-B");
    //     root.classList.add(`style-${view.settingsValues["style"]}`);
    // } 
    const model = view.model;
    const check = view.check;
    const hint = view.hint;
    const visuals = BLUEBERRY.calcVisuals(view);
    BLUEBERRY.animateBetweenVisuals(view, visuals, visuals);
    Object.entries(view.blackout.rectFromCell).forEach(([cell, e]) => {
        const blackedOut = hint === undefined ? false : hint.cells[cell] === undefined;
        e.style["visibility"] = blackedOut ? "visible" : "hidden";
    });
    const hintGroup = hint !== undefined ? hint.group : undefined;
    if (hintGroup !== undefined) {
        [view.edges/*, view.edgesOutline*/].forEach(edges => {
            PUZZLEUTIL.view.refreshEdges(view.svg, edges, (a, b) => {
                const block_a = model.blockFromCell[a];
                const block_b = model.blockFromCell[b];
                const isEdge = (block_a !== block_b);
                const style = block_a === hintGroup || block_b === hintGroup
                    ? "stroke-width: 3pt;"
                    : ""
                return [isEdge, style];
            });
        });
    } else {
        [view.edges/*, view.edgesOutline*/].forEach(edges => {
            PUZZLEUTIL.view.refreshEdges(view.svg, edges, (a, b) => {
                return (model.blockFromCell[a] != model.blockFromCell[b]);
            });
        });
    }
};
BLUEBERRY.calcVisuals = (view) => {
    let check = view.check;
    const hint = view.hint;
    if (view.settingsValues["autoCheck"] === "Auto") {
        if (check === undefined) {
            check = BLUEBERRY.checkSolved(view.model, view.state);
        }
    }
    const model = view.model;
    const state = view.state;
    const cellColorFromCellState = {
        "_": "var(--theme-blueberry-undecided)",
        "x": "var(--theme-blueberry-decided)",
        "o": "var(--theme-blueberry-decided)",
    };
    const colorFromCell = {};
    const errorColorFromCell = {};
    const dotVisibleFromCell = {};
    const berryVisibleFromCell = {};
    const textColorFromGroup = {};
    const textWeightFromGroup = {};
    const textOpacityFromGroup = {};
    Object.keys(model.grid.cells).forEach(cell => {
        const s = state.cells[cell];
        colorFromCell[cell] = cellColorFromCellState[s];
        const isErrorCell = check !== undefined && check.errorCells[cell] !== undefined;
        if (isErrorCell) {
            errorColorFromCell[cell] = "var(--theme-blueberry-error-cell)";
        }
        dotVisibleFromCell[cell] = s === "_";
        berryVisibleFromCell[cell] = s === "o";
    });
    const isNumberOutsideBoard = (group) => {
        return group.startsWith("R") || group.startsWith("C");
    };
    model.allGroups.forEach(group => {
        const isSatisfiedGroup = check !== undefined && check.satisfied2Groups[group];
        const isPrimaryHintGroup = hint !== undefined && group === hint.group;
        const weight = isPrimaryHintGroup ? "bold" : "";
        let clueCellOpened = false;
        if (group.startsWith("B")) {
            const cell = view.cellOfBlockClue[group];
            clueCellOpened = (view.state.cells[cell] !== "_");
        } else if (group.startsWith("N")) {
            const cell = model.cellFromNumberGroup[group];
            clueCellOpened = (view.state.cells[cell] !== "_");
        }
        textColorFromGroup[group] = isNumberOutsideBoard(group) 
            ? "var(--theme-blueberry-clue-text-outside-board)" 
            : `var(--theme-blueberry-clue-text-inside-board${clueCellOpened?'-opened':''})`;
        textWeightFromGroup[group] = weight;
        textOpacityFromGroup[group] = isSatisfiedGroup ? "25%" : "100%";
    });
    const visuals = { check, colorFromCell, errorColorFromCell, dotVisibleFromCell, berryVisibleFromCell, textColorFromGroup, textWeightFromGroup, textOpacityFromGroup };
    return visuals;
};
BLUEBERRY.animateBetweenVisuals = (view, visuals1, visuals2, enableErrorDelay) => {
    const model = view.model;
    const state = view.state;
    const errorDelay = enableErrorDelay && view.settingsValues["autoCheck"] === "Auto" ? 1000 : 1;
    Object.keys(model.grid.cells).forEach(cell => {
        const cellColor1 = visuals1.colorFromCell[cell];
        const cellColor2 = visuals2.colorFromCell[cell];
        const cellErrorColor2 = visuals2.errorColorFromCell[cell];
        const dotVisible1 = visuals1.dotVisibleFromCell[cell];
        const dotVisible2 = visuals2.dotVisibleFromCell[cell];
        const berryVisible1 = visuals1.berryVisibleFromCell[cell];
        const berryVisible2 = visuals2.berryVisibleFromCell[cell];
        let isError1 = false;
        let isError2 = false;
        if (visuals1.check !== undefined && visuals2.check !== undefined) {
            isError1 = visuals1.check.errorCells[cell] !== undefined;
            isError2 = visuals2.check.errorCells[cell] !== undefined;
        }
        const dot = view.maybeCircles.circles[cell];
        dot.style["visibility"] = dotVisible2 ? "visible" : "hidden";
        {
            const rect = view.grid.cells[cell].e;
            const e = rect;
            view.animator.playKeyframes(
                [
                    {
                        duration: 150,
                        fn: (t) => {
                            t = 1 - Math.pow(1 - t, 2);
                            e.style["fill"] = cssColorMix(cellColor1, cellColor2, t);
                            dot.style["opacity"] = "25%";
                        }
                    }
                ],
                e
            );
            if (isError2) {
                view.animator.playKeyframes(
                    [
                        {
                            duration: errorDelay,
                            fn: (t) => {},
                        },
                        {
                            duration: 150,
                            fn: (t) => {
                                t = 1 - Math.pow(1 - t, 2);
                                e.style["fill"] = cssColorMix(cellColor1, cellErrorColor2, t);
                                dot.style["opacity"] = "75%";
                            }
                        }
                    ],
                    e, "append"
                );
            }
        }
        {
            const berry = view.berryCircles.circles[cell];
            berry.style["visibility"] = berryVisible2 ? "visible" : "hidden";
            if (berryVisible2 && !berryVisible1) {
                const e = berry;
                view.animator.playKeyframes(
                    [
                        {
                            duration: 250,
                            fn: (t) => {
                                t = 1 - Math.pow(1 - t, 2);
                                const radius = lerp(1.5, 1, t) * view.berryRadius; 
                                e.setAttribute("r", `${radius}px`);
                            }
                        }
                    ],
                    e
                );
            }
        }
    });
    model.allGroups.forEach(group => {
        const textE = BLUEBERRY.textFromGroup(view, group);
        if (textE !== undefined) {
            const color1 = visuals1.textColorFromGroup[group];
            const color2 = visuals2.textColorFromGroup[group];
            const weight1 = visuals1.textWeightFromGroup[group];
            const weight2 = visuals2.textWeightFromGroup[group];
            const opacity1 = visuals1.textOpacityFromGroup[group];
            const opacity2 = visuals2.textOpacityFromGroup[group];
            let isError1 = false;
            let isError2 = false;
            if (visuals1.check !== undefined && visuals2.check !== undefined) {
                isError1 = visuals1.check.errorGroups[group] !== undefined;
                isError2 = visuals2.check.errorGroups[group] !== undefined;
            }
            const e = textE;
            view.animator.playKeyframes(
                [
                    {
                        duration: 150,
                        fn: (t) => {
                            textE.style["fill"] = color2;
                            textE.style["font-weight"] = weight2;
                            textE.style["opacity"] = opacity2;
                        }
                    }
                ],
                e
            );
            if (isError2) {
                view.animator.playKeyframes(
                    [
                        {
                            duration: errorDelay,
                            fn: (t) => {},
                        },
                        {
                            duration: 1,
                            fn: (t) => {
                                e.style["fill"] = "var(--theme-blueberry-error-text)";
                                e.style["font-weight"] = "bold";
                                e.style["opacity"] = "100%";
                            }
                        }
                    ],
                    e, "append"
                );
            }
        }
    });
};
BLUEBERRY.textFromGroup = (view, group) => {
    if (group.startsWith("R")) {
        const text = view.numbersLeft[`${group}C1`];
        return text;
    } else if (group.startsWith("C")) {
        const text = view.numbersAbove[`R1${group}`];
        return text;
    } else if (group.startsWith("B")) {
        const cell = view.cellOfBlockClue[group];
        const text = view.numbersCorner[cell];
        return text;
    } else if (group.startsWith("N-")) {
        const text = view.numbers[group.slice(2)];
        return text;
    }
};
BLUEBERRY.solvedAnimationColors = [ 
    // "slateblue", "plum", "silver", "#eff", "skyblue", "#3584e4","#222" 
    "var(--theme-blueberry-berry)", "silver", "beige", 
];
BLUEBERRY.hint = (model, state) => {
    const [berry, berries] = model.options.pairRuleEnabled ? ["cherry", "cherries"] : ["berry", "berries"];
    const compareWithSolution = PUZZLEUTIL.model.compareCellStatesToSolution(model.grid.cells, state.cells, model.solutionState.cells);
    if (compareWithSolution.status === "error") { return undefined; }
    const groupType = (group) => {
        if (group.startsWith("R")) { return "row"; }
        if (group.startsWith("C")) { return "column"; }
        if (group.startsWith("B")) { return "block"; }
        if (group.startsWith("N")) { return "number"; }
    };
    const groupName = (group) => {
        const t = groupType(group);
        if (t === "number") { return undefined; }
        const tCap = replaceStringCharAt(t, 0, t.slice(0, 1).toUpperCase());
        return `${tCap} ${group.slice(1)}`
    };
    const moves = BLUEBERRY.solve.findTechniques(model, state, "Advanced");
    const move = moves[0];
    if (move === undefined) { return undefined; }
    if (move.technique === "MIN" || move.technique === "MAX") {
        const primaryGroup = move.primaryGroups[0];
        const primaryGroupName = groupName(primaryGroup);
        const primaryGroupType = groupType(primaryGroup);
        const imum = (move.technique === "MIN") ? "minimum" : "maximum"; 
        const cells = {};
        const secondaryGroups = [];
        Object.entries(move.subs).forEach(([g, it]) => {
            // const groupCells = model.cellsOfGroup[g];
            // let kcount = 0;
            // Object.keys(groupCells).forEach(cell => {
            //     if (move.knowledge[cell] !== undefined) {
            //         kcount += 1;
            //     }
            // });
            if (it.inCounts["_"] > 0) {
                secondaryGroups.push(g);
            }
        });
        move.primaryGroups.forEach(g => {
            Object.keys(model.cellsOfGroup[g]).forEach(cell => {
                cells[cell] = true;
            });
        });
        secondaryGroups.forEach(g => {
            Object.keys(model.cellsOfGroup[g]).forEach(cell => {
                cells[cell] = true;
            });
        });
        const theseSubs = secondaryGroups.length === 1
            ? `this ${groupType(secondaryGroups[0])}`
            : `these ${groupType(secondaryGroups[0])}s`;
        let text;
        if (primaryGroupType === "block") {
            text = `This block requires the ${imum} number of ${berries} from each ${groupType(secondaryGroups[0])}.`;
        } else if (primaryGroupType == "number") {
            text = `This number clue requires the ${imum} number of ${berries} from ${theseSubs}.`;
        } else {
            text = `${primaryGroupName} requires the ${imum} number of ${berries} from ${theseSubs}.`;
        }
        return {move, text, cells, group: primaryGroup};
    } else if (move.technique === "FILL" || move.technique === "FULL") {
        let text = "";
        if (move.technique === "FILL") { 
            const clue = model.clueFromGroup[move.group];
            const gt = groupType(move.group);
            if (model.isTrio && gt !== "number") {
                text = `Fill the trio in this ${gt}.`;
            } else {
                text = `Fill this ${gt} with ${clue} ${clue === 1 ? berry : berries}.`;
            }
        } else if (move.technique === "FULL") {
            const clue = model.clueFromGroup[move.group];
            const gt = groupType(move.group);
            if (model.isTrio && gt !== "number") {
                text = `The trio is complete in this ${groupType(move.group)}.`;
            } else {
                text = `This ${groupType(move.group)} is full with ${clue} ${clue === 1 ? berry : berries}.`;
            }
        }
        const cells = {};
        Object.keys(model.cellsOfGroup[move.group]).forEach(cell => {
            cells[cell] = true;
        });
        return {move, text, cells, group: move.group};
    } else if (move.technique === "SHALLOW-LOOKAHEAD") {
        const cells = {};
        [Object.keys(move.knowledge)[0]].forEach(k => { cells[k] = true; } );
        const f = () => {
            const cell = Object.keys(cells)[0];
            const w = move.knowledge[cell];
            if (w === "x") {
                return `A cherry cannot be placed in this cell.`;
            } else if (w === "o") {
                return `A cherry must be placed in this cell.`;
            }
        };
        const text = f();
        const r = {move, text, cells, group: move.group};
        return r;
    } else if (move.technique === "SHALLOW-LOOKAHEAD-PAIRS") {
        const cells = {};
        [Object.keys(move.knowledge)[0]].forEach(k => { cells[k] = true; } );
        const text = `A ${berry} placed here could not pair with another cherry.`;
        const r = {move, text, cells};
        return r;
    } else if (move.technique === "PAIR-COMMONALITY") {
        const cells = {};
        [Object.keys(move.knowledge)[0]].forEach(k => { cells[k] = true; } );
        cells[move.cherryCell] = true;
        const text = `Both ways to pair with this ${berry} will eliminate this cell.`;
        const r = {move, text, cells};
        return r;
    } else if (move.technique === "COMBOS") {
        const f = () => {
            if (move.numOkCombos === 1) {
                return `There is only one way to fill this ${groupType(move.group)}.`;
            } else {
                return `Consider the possible ways to fill this ${groupType(move.group)}.`;
            }
        };
        const text = f();
        const cells = {};
        Object.keys(move.knowledge).forEach(k => { cells[k] = true; } );
        const r = {move, text, cells, group: move.group};
        return r;
    } else {
        const text = `${move.technique}`;
        const cells = {};
        Object.keys(move.knowledge).forEach(k => { cells[k] = true; } );
        const r = {move, text, cells, group: move.group};
        console.log(r);
        return r;
    }
};
