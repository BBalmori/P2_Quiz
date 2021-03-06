const { log, biglog, errorlog, colorize } = require("./out");
const model = require('./model');
const readline = require('readline');

/**
* Muestra la ayuda.
*
* @param rl Objeto readLine usado para implementar el CLI.
*/
exports.helpCmd = rl => {
    log("Comandos:");
    log("  h|help - Muestra esta ayuda.");
    log("  list - Listar los quizzes existentes.");
    log("  show <id> - Muestra la pregunta y la respuesta el quiz indicado");
    log("  add - A�adir un nuevo quiz interactivamente");
    log("  delete <id> - Borrar el quiz indicado.");
    log("  edit <id> - Editar el quiz indicado");
    log("  test <id> - Probar el quiz indicado");
    log("  p|play - Jugar a preguntar aleatoriamente todos los quizzes.");
    log("  credits - Cr�ditos.");
    log("  q|quit - Salir del programa.");
    rl.prompt();
};

/**
 * Lista todos los quizzes existentes en el modelo.
 *
 * @param rl Objeto readLine usado para implementar el CLI.
 */
exports.listCmd = rl => {
    model.getAll().forEach((quiz, id) => {
        log(` [${colorize(id, 'magenta')}]: ${quiz.question}`);
    });
    rl.prompt();
};

/**
 * Muestra el quiz indicado en el par�metro: la pregunta y la respuesta.
 *
 * @param id   Clave del quiz a mostrar.
 * @param rl Objeto readLine usado para implementar el CLI.
 */
exports.showCmd = (rl, id) => {
    if (typeof id === 'undefined') {
        errorlog(`Falta el par�metro id.`);
    } else {
        try {
            const quiz = model.getByIndex(id);
            log(` [${colorize(id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
        } catch (error) {
            errorlog(error);////
            rl.prompt();
        }
    }
    rl.prompt();
};

/**
 * A�ade un nuevo quiz al modelo.
 * Pregunta interactivamente por la pregunta y por la respuesta.
 *
 * Hay que recordar que el funcionamiento de la funcion rl.question es as�ncrono.
 * El prompt hay que sacarlo cuando ya se ha terminado la interacci�n con el usuario,
 * es decir, la llamada a rl.prompt() se debe hacer en la callback de la segunda
 * llamada a rl.question.
 *
 * @param rl Objeto readLine usado para implementar el CLI.
 */
exports.addCmd = rl => {
    rl.question(colorize(' Introduzca una pregunta: ', 'red'), question => {
        rl.question(colorize(' Introduzca la respuesta ', 'red'), answer => {
            model.add(question, answer);
            log(` ${colorize('Se ha a�adido', 'magenta')}: ${question} ${colorize('=>', 'magenta')} ${answer}`);
            rl.prompt();
        });
    });
};

/**
 * Borra un quiz del modelo-
 * 
 * @param id   Clave del quiz a borrar en el modelo.
 * @param rl Objeto readLine usado para implementar el CLI.
 * 
 */
exports.deleteCmd = (rl, id) => {
    if (typeof id === 'undefined') {
        errorlog(`Falta el par�metro id.`);
    } else {
        try {
            model.deleteByIndex(id);
        } catch (error) {
            errorlog(error);
            rl.prompt();
        }
    }
    rl.prompt();
};

/**
 * Edita un quiz del modelo.****************
 *
 * @param id   Clave del quiz a editar en el modelo.
 * @param rl Objeto readLine usado para implementar el CLI.
 */
exports.editCmd = (rl, id) => {
    if (typeof id === "undefined") {
        errorlog(`Falta el par�metro id.`);
        rl.prompt();
    } else {
        try {
            const quiz = model.getByIndex(id);
            process.stdout.isTTY && setTimeout(() => { rl.write(quiz.question) }, 0);
            rl.question(colorize(' Introduzca una pregunta: ', 'red'), question => {
                process.stdout.isTTY && setTimeout(() => { rl.write(quiz.answer) }, 0);
                rl.question(colorize(' Introduzca una respuesta ', 'red'), answer => {
                    model.update(id, question, answer);
                    log(`Se ha cambiado el quiz ${colorize(id, 'magenta')} por: ${question} ${colorize('=>', 'magenta')} ${answer}`);
                    rl.prompt();
                });
            });
        } catch (error) {
            errorlog(error);
            rl.prompt();
        }
    }

   
};

/**
 * Prueba un quiz, es decir, hace una pregunta del modelo a la que debemos contestar.
 *
 * @param id   Clave del quiz a probar.
 * @param rl Objeto readLine usado para implementar el CLI.
 */
exports.testCmd = (rl, id) => {
    if (typeof id === "undefined") {
        errorlog(`Falta el par�metro id.`);
        rl.prompt();
    } else {
        try {
            const quiz = model.getByIndex(id);
            rl.question(`${colorize(quiz.question, 'red')} ${colorize('?', 'red')} `, answer => {
                if (answer === quiz.answer) {
                    log(`Su respuesta es correcta.`);
                    log(`${biglog('Correcta', 'green')}`);
                } else {
                    log(`Su respuesta es incorrecta.`);
                    log(`${biglog('Incorrecto', 'red')}`);
                }
                rl.prompt();
            });
        } catch (error) {
            errorlog(error.message);
            rl.prompt();
        }   
    }   
};

/**
 * Pregunta todos los quizzes existentes en el modelo en orden aleatorio.
 * Se gana si se contesta a todos satisfactoriamente.
 *
 * @param rl Objeto readLine usado para implementar el CLI.
 */
exports.playCmd = rl => {
    let score = 0; //Preguntas acertadas
    let nPreguntas = model.getAll().length; //Numero de preguntas del quizz
    let toBeResolved = []; //Creo el array vacio que va a tener los id de las preguntas sin contestar
    for (let i = 0; i < nPreguntas; i++) { //Relleno el array con los id de las preguntas del quiz
        toBeResolved[i] = i;
    }
    const playOne = () => {
        if (toBeResolved.length === 0) {
            log(`No hay nada m�s que preguntar. `);
            log(`Fin del juego. Aciertos: ${score} `);
            biglog(score, 'magenta');
            rl.prompt();
        } else {
            let id = Math.floor(Math.random() * (toBeResolved.length - 1));//coger un id al azar
            const quiz = model.getByIndex(id);
            toBeResolved.splice(id, 1);
            rl.question(`${colorize(quiz.question, 'magenta')}${colorize('?', 'magenta')} `, answer => {
                if (answer === quiz.answer) {
                    score++;
                    log(`CORRECTO - Lleva ${score} aciertos.`);
                    playOne();
                } else {
                    log(`INCORRECTO.`);
                    log(`Fin del juego. Aciertos: ${score}`);
                    biglog(score, 'magenta');
                    rl.prompt();
                }
                
            });
          
        }
    }
    playOne();
};

/**
 * Muestra el nombre del autor de la pr�ctica.
 *
 * @param rl Objeto readLine usado para implementar el CLI.
 */
exports.creditsCmd = rl => {
    log('Autor de la pr�ctica: ');
    log('BELEN', 'green');
    rl.prompt();
};

/**
 * Terminar el programa.
 *
 * @param rl Objeto readLine usado para implementar el CLI.
 */
exports.quitCmd = rl => {
    rl.close();
};