
import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api/logs";

function App() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [editingId, setEditingId] = useState(null);

  const emptyForm = {
    sourceIP: "",
    destinationIP: "",
    port: "",
    protocol: "TCP",
    status: "SUCCESS"
  };

  const [form, setForm] = useState(emptyForm);

  const fetchLogs = async () => {
    try {
      const response = await axios.get(API);
      setLogs(response.data);
    } catch (error) {
      setMessage("Unable to load network logs. Check backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const data = {
        ...form,
        port: Number(form.port)
      };

      if (editingId) {
        const response = await axios.put(`${API}/${editingId}`, data);
        setMessage(response.data.message);
      } else {
        const response = await axios.post(API, data);
        setMessage(response.data.message);
      }

      setForm(emptyForm);
      setEditingId(null);
      fetchLogs();

    } catch (error) {
      setMessage(error.response?.data?.message || "Operation failed.");
    }
  };

  const editLog = (log) => {
    setEditingId(log._id);

    setForm({
      sourceIP: log.sourceIP,
      destinationIP: log.destinationIP,
      port: String(log.port),
      protocol: log.protocol,
      status: log.status
    });

    setMessage("Editing selected network log.");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    setMessage("");
  };

  const deleteLog = async (id) => {
    try {
      await axios.delete(`${API}/${id}`);
      setMessage("Log deleted successfully");
      fetchLogs();
    } catch (error) {
      setMessage("Unable to delete log");
    }
  };

  const successful = logs.filter(log => log.status === "SUCCESS").length;
  const failed = logs.filter(log => log.status === "FAILED").length;
  const alerts = logs.filter(log => log.alert === true).length;

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.sourceIP.toLowerCase().includes(search.toLowerCase()) ||
      log.destinationIP.toLowerCase().includes(search.toLowerCase()) ||
      log.protocol.toLowerCase().includes(search.toLowerCase());

    const matchesFilter = filter === "ALL" || log.status === filter;

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="dashboard">

      <header className="header">
        <div>
          <h1>Network Event Log Analyzer</h1>
          <p>Monitor, manage and analyze network activities</p>
        </div>
        <div className="system-status">
          <span className="dot"></span>
          System Dashboard
        </div>
      </header>

      <main className="main-content">

        <section className="stats">
          <div className="stat-card total">
            <p>Total Logs</p>
            <h2>{logs.length}</h2>
          </div>
          <div className="stat-card success">
            <p>Successful</p>
            <h2>{successful}</h2>
          </div>
          <div className="stat-card failed">
            <p>Failed</p>
            <h2>{failed}</h2>
          </div>
          <div className="stat-card alerts">
            <p>Security Alerts</p>
            <h2>{alerts}</h2>
          </div>
        </section>

        <section className="form-section">
          <h2>{editingId ? "Edit Network Event" : "Add Network Event"}</h2>
          <p className="section-description">
            Enter network event details below
          </p>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">

              <div className="form-group">
                <label>Source IP Address</label>
                <input
                  type="text"
                  name="sourceIP"
                  placeholder="192.168.1.10"
                  value={form.sourceIP}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Destination IP Address</label>
                <input
                  type="text"
                  name="destinationIP"
                  placeholder="192.168.1.20"
                  value={form.destinationIP}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Port Number</label>
                <input
                  type="number"
                  name="port"
                  placeholder="443"
                  min="1"
                  max="65535"
                  value={form.port}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Protocol</label>
                <select name="protocol" value={form.protocol} onChange={handleChange}>
                  <option value="TCP">TCP</option>
                  <option value="UDP">UDP</option>
                </select>
              </div>

              <div className="form-group">
                <label>Status</label>
                <select name="status" value={form.status} onChange={handleChange}>
                  <option value="SUCCESS">SUCCESS</option>
                  <option value="FAILED">FAILED</option>
                </select>
              </div>

            </div>

            <button className="add-button" type="submit">
              {editingId ? "Update Network Log" : "+ Add Network Log"}
            </button>

            {editingId && (
              <button
                className="cancel-button"
                type="button"
                onClick={cancelEdit}
              >
                Cancel Edit
              </button>
            )}
          </form>

          {message && <div className="message">{message}</div>}
        </section>

        <section className="logs-section">
          <div className="logs-heading">
            <div>
              <h2>Network Event Logs</h2>
              <p className="section-description">
                View and manage recorded network activities
              </p>
            </div>
            <button className="refresh-button" onClick={fetchLogs}>
              Refresh
            </button>
          </div>

          <div className="filters">
            <input
              type="text"
              placeholder="Search IP address or protocol..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="ALL">All Status</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>

          {loading ? (
            <p className="empty-message">Loading logs...</p>
          ) : filteredLogs.length === 0 ? (
            <p className="empty-message">No network logs found.</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Source IP</th>
                    <th>Destination IP</th>
                    <th>Port</th>
                    <th>Protocol</th>
                    <th>Status</th>
                    <th>DFA Alert</th>
                    <th>Time</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredLogs.map(log => (
                    <tr key={log._id}>
                      <td>{log.sourceIP}</td>
                      <td>{log.destinationIP}</td>
                      <td>{log.port}</td>
                      <td>{log.protocol}</td>
                      <td>
                        <span className={`badge ${log.status.toLowerCase()}`}>
                          {log.status}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${log.alert ? "alert" : "normal"}`}>
                          {log.alert ? "DETECTED" : "NORMAL"}
                        </span>
                      </td>
                      <td>{new Date(log.timestamp).toLocaleString()}</td>
                      <td>
                        <button
                          className="edit-button"
                          onClick={() => editLog(log)}
                        >
                          Edit
                        </button>
                        <button
                          className="delete-button"
                          onClick={() => deleteLog(log._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

<section className="logs-section flat-section">
  <h2>FLAT Concepts Used</h2>
  <p className="section-description">
    Formal Language and Automata Theory concepts related to this project
  </p>

  <div className="concept-grid">
    <div className="concept-card">
      <h3>Regular Expression</h3>
      <p>Used to validate the IPv4 address format.</p>
      <span className="concept-status">Implemented</span>
    </div>

    <div className="concept-card">
      <h3>DFA</h3>
      <p>Detects repeated failed login attempts from the same source IP.</p>
      <span className="concept-status">Implemented</span>
    </div>

    <div className="concept-card">
      <h3>CFG</h3>
      <p>Represents the grammatical structure of valid network log entries.</p>
      <span className="concept-status">Related Concept</span>
    </div>

    <div className="concept-card">
      <h3>PDA</h3>
      <p>Explains stack-based processing of nested structures.</p>
      <span className="concept-status">Related Concept</span>
    </div>

    <div className="concept-card">
      <h3>Turing Machine</h3>
      <p>Provides the theoretical model for general computation and log processing.</p>
      <span className="concept-status">Related Concept</span>
    </div>
  </div>
</section>

<section className="logs-section flat-section">
  <h2>Computer Networks Concepts Used</h2>
  <p className="section-description">
    Networking concepts related to network event monitoring
  </p>

  <div className="concept-grid">
    <div className="concept-card">
      <h3>IP Address</h3>
      <p>Identifies the source and destination devices in network logs.</p>
      <span className="concept-status">Implemented</span>
    </div>

    <div className="concept-card">
      <h3>TCP / UDP</h3>
      <p>Identifies the transport protocols used in network communication.</p>
      <span className="concept-status">Implemented</span>
    </div>

    <div className="concept-card">
      <h3>Port Number</h3>
      <p>Identifies the application service associated with network traffic.</p>
      <span className="concept-status">Implemented</span>
    </div>

    <div className="concept-card">
      <h3>Network Monitoring</h3>
      <p>Monitors network events and records successful and failed activities.</p>
      <span className="concept-status">Implemented</span>
    </div>

    <div className="concept-card">
      <h3>Network Security</h3>
      <p>Highlights repeated failed events through security alerts.</p>
      <span className="concept-status">Implemented</span>
    </div>
  </div>
</section>


      </main>

      <footer>
        Network Event Log Analyzer | React + Node.js + MongoDB
      </footer>
    </div>
  );
}

export default App;
