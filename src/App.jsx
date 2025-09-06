import React, { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/projects')
      .then(res => {
        if (!res.ok) {
          throw new Error('Network response was not ok');
        }
        return res.json();
      })
      .then(data => {
        setProjects(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img src="Octocat.png" className="App-logo" alt="logo" />
        <p>
          GitHub Codespaces <span className="heart"♥️</span> React
        </p>
        <p className="small">
          Edit <code>src/App.jsx</code> and save to reload.
        </p>
        <p>
          <a
            className="App-link"
            href="https://reactjs.org"
            target="_blank"
            rel="noopener noreferrer"
          >
            Learn React
          </a>
        </p>
      </header>

      <main style={{ padding: '1rem', width: '90%', margin: 'auto' }}>
        <h2>Projects List</h2>

        {loading && <p>Loading projects...</p>}

        {error && <p style={{ color: 'red' }}>Error: {error}</p>}

        {!loading && !error && projects.length === 0 && <p>No projects found.</p>}

        {!loading && !error && projects.length > 0 && (
          <table
            border="1"
            cellPadding="8"
            style={{ borderCollapse: 'collapse', width: '100%' }}
          >
            <thead>
              <tr>
                {Object.keys(projects[0]).map((key) => (
                  <th key={key} style={{ backgroundColor: '#282c34', color: 'white' }}>
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projects.map((project, idx) => (
                <tr key={idx}>
                  {Object.values(project).map((val, i) => (
                    <td key={i} style={{ textAlign: 'center' }}>
                      {val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  );
}

export default App;