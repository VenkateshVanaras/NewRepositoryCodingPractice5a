const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "moviesData.db");
const app = express();
app.use(express.json());
let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running on http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();
const convertDbObjectToResponseObject = (dbObject) => {
  return {
    movieId: dbObject.movie_id,
    directorId: dbObject.director_id,
    movieName: dbObject.movie_name,
    leadActor: dbObject.lead_actor,
  };
};
const convertDbDirectorObToResponseOb = (dbObject) => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
  };
};

const convertEachMovieName = (dbObject) => {
  return {
    movieName: dbObject.movie_name,
  };
};

app.get("/movies/", async (request, response) => {
  const listOfMoviesQuery = `
        SELECT *
        FROM movie;
    `;
  const listOfMovies = await db.all(listOfMoviesQuery);
  response.send(
    listOfMovies.map((eachMovie) => convertEachMovieName(eachMovie))
  );
});

// creating POST  method
app.post("/movies/", async (request, response) => {
  const { directorId, movieName, leadActor } = request.body;
  const postMovieQuery = `
        INSERT INTO 
        movie(director_id,movie_name,lead_actor)
        VALUES(
            ${directorId},
            '${movieName}',
            '${leadActor}'
        );
    `;
  await db.run(postMovieQuery);
  response.send("Movie Successfully Added");
});
// get a movie with movieId
app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;

  const movieQuery = `
        SELECT *
        FROM movie
        WHERE movie_id = ${movieId};
    `;
  const movieTable = await db.get(movieQuery);
  response.send(convertDbObjectToResponseObject(movieTable));
});
// update movie

app.put("/movies/:movieId/", async (request, response) => {
  const { directorId, movieName, leadActor } = request.body;
  const { movieId } = request.params;
  const updateMovieQuery = `
    UPDATE
        movie
    SET
        director_id = ${directorId},
        movie_name = '${movieName}',
        lead_actor = '${leadActor}'
    WHERE
        movie_id = ${movieId};`;

  await db.run(updateMovieQuery);
  response.send("Movie Details Updated");
});

// delete movie
app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const movieDeleteQuery = `
        DELETE FROM movie 
        WHERE movie_id = ${movieId} ;
    `;
  await db.run(movieDeleteQuery);
  response.send("Movie Removed");
});
// list of all directors
app.get("/directors/", async (request, response) => {
  const listOfDirectorsQuery = `
        SELECT *
        FROM director;
    `;
  const listOfDirectors = await db.all(listOfDirectorsQuery);
  response.send(
    listOfDirectors.map((eachDirector) =>
      convertDbDirectorObToResponseOb(eachDirector)
    )
  );
});

// list movies with director Id
app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getDirectorMoviesQuery = `
        SELECT movie_name FROM movie
        WHERE director_id = ${directorId};
    `;
  const moviesArray = await db.all(getDirectorMoviesQuery);
  response.send(
    moviesArray.map((eachMovie) => convertEachMovieName(eachMovie))
  );
});

module.exports = app;
