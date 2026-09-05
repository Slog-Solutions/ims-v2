import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Plus,
  MapPin,
  Layers,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  User,
  Clock,
  Filter,
  ArrowRight,
  ShieldCheck,
  Check
} from 'lucide-react';
import api from '../api/api.js';
import { useToast } from '../components/layout/Toast.jsx';

const TaskPlanner = () => {
  const { user } = useSelector((state) => state.auth);
  const isMaster = user?.role === 'master';
  const showToast = useToast();
  const toast = {
    success: (msg) => showToast({ title: 'Success', sub: msg, variant: 'success' }),
    error: (msg) => showToast({ title: 'Error', sub: msg, variant: 'error' }),
    warn: (msg) => showToast({ title: 'Warning', sub: msg, variant: 'warning' }),
    info: (msg) => showToast({ title: 'Info', sub: msg, variant: 'info' }),
  };

  // State
  const [tasks, setTasks] = useState([]);
  const [equipmentSets, setEquipmentSets] = useState([]);
  const [establishments, setEstablishments] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);

  // Loading states
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New task form
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTaskForm, setNewTaskForm] = useState({
    name: '',
    description: '',
    requiredEquipmentSet: '',
    assignedEstablishment: isMaster ? '' : user?._id,
    startDate: '',
    endDate: ''
  });

  // Allocation state
  const [availabilityCheck, setAvailabilityCheck] = useState([]); // Stores holding status check for required items
  const [availablePhysicalItems, setAvailablePhysicalItems] = useState([]); // Available items to select
  const [selectedAllocations, setSelectedAllocations] = useState({}); // Mapping of nomenclature ID -> array of physical item IDs
  const [vintageFilter, setVintageFilter] = useState('newest'); // newest, oldest

  // Fetch initial data
  const fetchTasksAndSets = async () => {
    try {
      setLoadingTasks(true);
      const tasksRes = await api.get('/tasks');
      if (tasksRes.data.success) {
        setTasks(tasksRes.data.data);
      }

      const setsResData = await api.get('/equipment-sets');
      if (setsResData.data.success) {
        setEquipmentSets(setsResData.data.data);
      }

      if (isMaster) {
        const estsRes = await api.get('/users');
        if (estsRes.data.success) {
          setEstablishments(estsRes.data.data.users.filter(u => u.role === 'establishment'));
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load tasks and equipment sets');
    } finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    fetchTasksAndSets();
  }, [isMaster]);

  // Handle selected task change (runs deficiency check and gathers allocatable items)
  useEffect(() => {
    const runAvailabilityCheck = async () => {
      if (!selectedTask) return;
      try {
        setLoadingDetails(true);

        // 1. Get the stats for the equipment set allocated to the unit
        const setStatsRes = await api.get(`/equipment-sets/${selectedTask.requiredEquipmentSet._id}/stats?establishmentId=${selectedTask.assignedEstablishment._id}`);
        if (setStatsRes.data.success) {
          const stats = setStatsRes.data.data;
          setAvailabilityCheck(stats.holdingState);
        }

        // 2. Fetch all physical items matching these nomenclatures at this unit that are serviceable and either stored or already assigned to THIS task
        const physicalItemsRes = await api.get(`/physical-items?establishment=${selectedTask.assignedEstablishment._id}&serviceability=serviceable`);
        if (physicalItemsRes.data.success) {
          // Filter to items that are in the set components
          const componentItemIds = selectedTask.requiredEquipmentSet.items.map(it => it.item._id || it.item);
          const filteredPhysicals = physicalItemsRes.data.data.filter(pi =>
            componentItemIds.includes(pi.item._id || pi.item) &&
            (pi.status === 'stored' || (pi.status === 'task_assigned' && selectedTask.allocatedItems.some(allocated => allocated._id === pi._id)))
          );
          setAvailablePhysicalItems(filteredPhysicals);

          // Auto-select items already allocated to the task
          const preselected = {};
          selectedTask.requiredEquipmentSet.items.forEach(setItem => {
            const itemId = setItem.item._id || setItem.item;
            const allocatedForNomenclature = selectedTask.allocatedItems
              .filter(ai => ai.item._id === itemId)
              .map(ai => ai._id);
            preselected[itemId] = allocatedForNomenclature;
          });
          setSelectedAllocations(preselected);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to run store availability check');
      } finally {
        setLoadingDetails(false);
      }
    };

    runAvailabilityCheck();
  }, [selectedTask]);

  // Handle creating task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await api.post('/tasks', newTaskForm);
      if (res.data.success) {
        toast.success('Combat engineer task planned successfully!');
        setShowCreateModal(false);
        setNewTaskForm({
          name: '',
          description: '',
          requiredEquipmentSet: '',
          assignedEstablishment: isMaster ? '' : user?._id,
          startDate: '',
          endDate: ''
        });
        fetchTasksAndSets();
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to create task');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle saving allocations
  const handleSaveAllocations = async () => {
    if (!selectedTask) return;

    // Flatten selectedAllocations object to a single array of physical IDs
    const flatAllocationIds = Object.values(selectedAllocations).flat();

    try {
      setSubmitting(true);
      const res = await api.post(`/tasks/${selectedTask._id}/allocate`, { physicalItemIds: flatAllocationIds });
      if (res.data.success) {
        toast.success('Physical equipment allocated successfully. Task activated!');
        // Refresh task list
        const tasksRes = await api.get('/tasks');
        if (tasksRes.data.success) {
          setTasks(tasksRes.data.data);
          // Find updated selected task to refresh UI
          const updated = tasksRes.data.data.find(t => t._id === selectedTask._id);
          setSelectedTask(updated);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to allocate physical stores');
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle physical item selection
  const handleToggleItemSelection = (nomenclatureId, physicalItemId, requiredQty) => {
    const currentList = selectedAllocations[nomenclatureId] || [];
    let newList;

    if (currentList.includes(physicalItemId)) {
      newList = currentList.filter(id => id !== physicalItemId);
    } else {
      // Enforce allocation limits (cannot exceed required quantity)
      if (currentList.length >= requiredQty) {
        toast.warn(`Cannot allocate more than the required scale of ${requiredQty}`);
        return;
      }
      newList = [...currentList, physicalItemId];
    }

    setSelectedAllocations({
      ...selectedAllocations,
      [nomenclatureId]: newList
    });
  };

  // Update Task Status (Complete / Cancel)
  const handleUpdateStatus = async (taskId, newStatus) => {
    try {
      const res = await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      if (res.data.success) {
        toast.success(`Task marked as ${newStatus}. All stores returned to base.`);
        setSelectedTask(null);
        fetchTasksAndSets();
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to update task status');
    }
  };

  // Sort physical items by vintage selector
  const getSortedPhysicalItems = (nomenclatureId) => {
    const items = availablePhysicalItems.filter(pi => pi.item._id === nomenclatureId);

    return items.sort((a, b) => {
      if (vintageFilter === 'newest') {
        return b.procurementYear - a.procurementYear; // newer first
      } else {
        return a.procurementYear - b.procurementYear; // older first
      }
    });
  };

  return (
    <div className="container-fluid py-3">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h1 className="page-title gradient-text mb-1">Combat Engineer Task Planner</h1>
          <p className="page-subtitle mb-0">Plan tactical operations, run store deficiency audits, and allocate serialized items by vintage parameters.</p>
        </div>

        {/* Master / Commander can plan new tasks */}
        {isMaster && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary-farm"
          >
            <Plus size={16} /> Plan New Task
          </button>
        )}
      </div>

      {loadingTasks ? (
        <div className="d-flex justify-content-center align-items-center py-5">
          <div className="spinner-border text-success" role="status">
            <span className="visually-hidden">Loading tasks...</span>
          </div>
        </div>
      ) : (
        <div className="row g-4">

          {/* LEFT COLUMN: List of planned / active tasks */}
          <div className="col-lg-4">
            <div className="card-farm glass-panel p-4 h-100 d-flex flex-column gap-3">
              <h3 className="fw-bold mb-2 text-dark-theme" style={{ fontSize: '18px' }}>Operations Dashboard</h3>

              {tasks.length === 0 ? (
                <div className="text-center p-4 text-muted" style={{ fontSize: '13px' }}>
                  No planned or active tasks found.
                </div>
              ) : (
                <div className="d-flex flex-column gap-2" style={{ maxHeight: '550px', overflowY: 'auto' }}>
                  {tasks.map((task) => {
                    const isSelected = selectedTask?._id === task._id;
                    const itemsAllocCount = task.allocatedItems?.length || 0;

                    return (
                      <div
                        key={task._id}
                        onClick={() => setSelectedTask(task)}
                        className={`p-3 rounded-4 cursor-pointer transition-all border ${isSelected ? 'border-success' : 'border-success-subtle'}`}
                        style={{
                          background: isSelected ? 'rgba(92, 123, 87, 0.12)' : 'var(--bg-card)',
                          boxShadow: isSelected ? 'var(--shadow-md)' : 'none'
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h4 className="fw-bold mb-0 text-success text-truncate" style={{ fontSize: '15px', maxWidth: '70%' }}>{task.name}</h4>
                          <span className={`badge py-1 px-2 rounded-pill border-0 ${task.status === 'active' ? 'bg-success text-white' :
                              task.status === 'completed' ? 'bg-info text-white' :
                                task.status === 'cancelled' ? 'bg-danger text-white' :
                                  'bg-warning text-dark'
                            }`} style={{ fontSize: '10px' }}>
                            {task.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-muted text-truncate mb-2" style={{ fontSize: '12px' }}>{task.description}</p>

                        <div className="d-flex align-items-center justify-content-between text-muted border-top pt-2 mt-1" style={{ fontSize: '11px' }}>
                          <span className="d-flex align-items-center gap-1"><Layers size={11} /> {task.requiredEquipmentSet.name}</span>
                          <span className="d-flex align-items-center gap-1"><MapPin size={11} /> {task.assignedEstablishment.establishmentName}</span>
                        </div>
                        <div className="d-flex align-items-center justify-content-between text-muted mt-1.5" style={{ fontSize: '11px' }}>
                          <span className="d-flex align-items-center gap-1"><Calendar size={11} /> {new Date(task.startDate).toLocaleDateString('en-IN')}</span>
                          <span className="fw-bold text-success">{itemsAllocCount} Allocated</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Deficiency Check & Allocation dashboard */}
          <div className="col-lg-8">
            <AnimatePresence mode="wait">
              {!selectedTask ? (
                <div className="card-farm glass-panel p-5 text-center h-100 d-flex flex-column justify-content-center align-items-center">
                  <Calendar size={48} className="text-success mb-3 opacity-30" />
                  <h4 className="fw-bold text-success">Select a Combat Task</h4>
                  <p className="text-muted">Select an engineer operation on the left panel to review store availability, coordinate deficiencies, and assign serialized inventory.</p>
                </div>
              ) : (
                <motion.div
                  key={selectedTask._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="d-flex flex-column gap-4"
                >
                  {/* Task details panel */}
                  <div className="card-farm glass-panel p-4">
                    <div className="d-flex justify-content-between align-items-start mb-3 flex-wrap gap-2">
                      <div>
                        <h3 className="fw-bold text-success mb-1" style={{ fontSize: '20px' }}>{selectedTask.name}</h3>
                        <p className="text-muted mb-0" style={{ fontSize: '13px' }}>{selectedTask.description}</p>
                      </div>

                      {/* Task control action */}
                      {selectedTask.status === 'active' && (
                        <div className="d-flex gap-2">
                          <button
                            onClick={() => handleUpdateStatus(selectedTask._id, 'completed')}
                            className="btn btn-sm btn-outline-success rounded-pill px-3 py-1.5 font-semibold"
                            style={{ fontSize: '12px' }}
                          >
                            Mark Completed
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(selectedTask._id, 'cancelled')}
                            className="btn btn-sm btn-outline-danger rounded-pill px-3 py-1.5 font-semibold"
                            style={{ fontSize: '12px' }}
                          >
                            Cancel Operation
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="row g-2 border-top pt-3 text-muted" style={{ fontSize: '13px' }}>
                      <div className="col-md-4">
                        <span className="d-block fw-semibold text-success">Required Equipment Set</span>
                        <span className="fw-bold text-dark-theme">{selectedTask.requiredEquipmentSet.name}</span>
                      </div>
                      <div className="col-md-4">
                        <span className="d-block fw-semibold text-success">Holding Unit Base</span>
                        <span className="fw-bold text-dark-theme">{selectedTask.assignedEstablishment.establishmentName}</span>
                      </div>
                      <div className="col-md-4">
                        <span className="d-block fw-semibold text-success">Execution Dates</span>
                        <span className="fw-bold text-dark-theme">
                          {new Date(selectedTask.startDate).toLocaleDateString('en-IN')} - {new Date(selectedTask.endDate).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Operational tab details: Availability & Allocation */}
                  {selectedTask.status !== 'completed' && selectedTask.status !== 'cancelled' && (
                    <>
                      {/* Category 1: Deficiency & Availability Audits */}
                      <div className="card-farm glass-panel p-4">
                        <h3 className="fw-bold mb-3" style={{ fontSize: '18px' }}>Store Deficiency Auditing</h3>
                        {loadingDetails ? (
                          <div className="d-flex justify-content-center py-4">
                            <div className="spinner-border text-success" role="status"></div>
                          </div>
                        ) : (
                          <div className="table-responsive-farm">
                            <table className="table glass-table align-middle mb-0">
                              <thead>
                                <tr>
                                  <th>Nomenclature</th>
                                  <th className="text-center">Required Scale</th>
                                  <th className="text-center">Serviceable at Unit</th>
                                  <th className="text-center">Allocated for Task</th>
                                  <th className="text-center">Deficiency State</th>
                                </tr>
                              </thead>
                              <tbody>
                                {availabilityCheck.map((check, idx) => {
                                  const allocatedCount = selectedAllocations[check.itemId]?.length || 0;
                                  const shortage = Math.max(0, check.required - check.serviceable);

                                  return (
                                    <tr key={idx}>
                                      <td><span className="fw-bold text-success">{check.nomenclature}</span></td>
                                      <td className="text-center fw-semibold">{check.required} {check.unitOfIssue}</td>
                                      <td className="text-center fw-semibold text-success">{check.serviceable}</td>
                                      <td className="text-center fw-bold">{allocatedCount} / {check.required}</td>
                                      <td className="text-center fw-bold">
                                        {shortage > 0 ? (
                                          <span className="badge bg-danger-subtle text-danger py-1.5 px-3 rounded-pill border-danger-subtle d-flex align-items-center gap-1 justify-content-center mx-auto" style={{ width: 'fit-content' }}>
                                            <AlertTriangle size={12} /> -{shortage} Shortage!
                                          </span>
                                        ) : (
                                          <span className="badge bg-success-subtle text-success py-1.5 px-3 rounded-pill border-success-subtle d-flex align-items-center gap-1 justify-content-center mx-auto" style={{ width: 'fit-content' }}>
                                            <CheckCircle2 size={12} /> Enough Stock
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      {/* Category 2: Serialized Item Allocation Panel */}
                      <div className="card-farm glass-panel p-4">
                        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                          <div>
                            <h3 className="fw-bold mb-1" style={{ fontSize: '18px' }}>Serialized Stores Allocation</h3>
                            <p className="text-muted mb-0" style={{ fontSize: '12px' }}>Choose the specific physical items to deploy for this drill/operation.</p>
                          </div>

                          {/* Vintage Priority filter */}
                          <div className="d-flex align-items-center gap-2">
                            <span className="text-muted d-flex align-items-center gap-1" style={{ fontSize: '12px' }}><Filter size={13} /> Vintage Priority:</span>
                            <select
                              className="form-select glass-input border-success-subtle py-1.5 px-3 rounded-3"
                              value={vintageFilter}
                              onChange={(e) => setVintageFilter(e.target.value)}
                              style={{ width: '150px', fontSize: '12px', background: 'var(--bg-card)', color: 'var(--text-dark)' }}
                            >
                              <option value="newest">Newest First (Low Age)</option>
                              <option value="oldest">Oldest First (High Age)</option>
                            </select>
                          </div>
                        </div>

                        {loadingDetails ? (
                          <div className="d-flex justify-content-center py-4">
                            <div className="spinner-border text-success" role="status"></div>
                          </div>
                        ) : (
                          <div className="d-flex flex-column gap-3">
                            {selectedTask.requiredEquipmentSet.items.map((setItem) => {
                              const nomenclatureId = setItem.item._id || setItem.item;
                              const nomenclatureName = setItem.item.nomenclature || 'Item';
                              const requiredQty = setItem.requiredQuantity;

                              const unitPhysicals = getSortedPhysicalItems(nomenclatureId);
                              const allocatedList = selectedAllocations[nomenclatureId] || [];

                              return (
                                <div key={nomenclatureId} className="border rounded-4 p-3" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
                                  <div className="d-flex justify-content-between align-items-center mb-2.5">
                                    <h4 className="fw-bold mb-0 text-success" style={{ fontSize: '14px' }}>
                                      {nomenclatureName}
                                      <span className="text-muted ms-2" style={{ fontSize: '12px' }}>({allocatedList.length} of {requiredQty} Allocated)</span>
                                    </h4>
                                    {allocatedList.length === requiredQty ? (
                                      <span className="badge bg-success text-white py-1 px-2.5 rounded-pill" style={{ fontSize: '10px' }}><ShieldCheck size={11} className="inline me-1" /> Ready</span>
                                    ) : (
                                      <span className="badge bg-warning text-dark py-1 px-2.5 rounded-pill" style={{ fontSize: '10px' }}>Allocation Incomplete</span>
                                    )}
                                  </div>

                                  {unitPhysicals.length === 0 ? (
                                    <div className="text-muted p-2 text-center" style={{ fontSize: '12px' }}>
                                      No serviceable physical items of this nomenclature available at this unit store.
                                    </div>
                                  ) : (
                                    <div className="d-flex gap-2 flex-wrap" style={{ maxHeight: '120px', overflowY: 'auto', padding: '2px' }}>
                                      {unitPhysicals.map((pi) => {
                                        const isSelected = allocatedList.includes(pi._id);
                                        const isAssignedToOther = pi.status === 'task_assigned' && !isSelected;

                                        return (
                                          <button
                                            key={pi._id}
                                            disabled={isAssignedToOther}
                                            onClick={() => handleToggleItemSelection(nomenclatureId, pi._id, requiredQty)}
                                            className={`btn text-start p-2.5 rounded-3 border transition-all d-flex flex-column justify-content-between align-items-start ${isSelected ? 'border-success text-success bg-success-subtle shadow-sm' :
                                                isAssignedToOther ? 'opacity-40 border-dashed text-muted cursor-not-allowed' :
                                                  'border-success-subtle text-dark-theme hover:bg-success-subtle'
                                              }`}
                                            style={{
                                              width: '135px',
                                              fontSize: '11px',
                                              cursor: isAssignedToOther ? 'not-allowed' : 'pointer'
                                            }}
                                          >
                                            <div className="d-flex justify-content-between align-items-center w-100 mb-1">
                                              <span className="fw-bold">{pi.serialNumber}</span>
                                              {isSelected && <Check size={12} />}
                                            </div>
                                            <div className="text-muted d-flex justify-content-between w-100" style={{ fontSize: '10px' }}>
                                              <span>Procured: {pi.procurementYear}</span>
                                              <span>Age: {pi.age}y</span>
                                            </div>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}

                            {/* Submit Allocations */}
                            <div className="d-flex justify-content-end gap-3 border-top pt-3 mt-2">
                              <button
                                onClick={handleSaveAllocations}
                                disabled={submitting}
                                className="btn btn-primary-farm rounded-pill px-4 py-2 fw-bold"
                              >
                                {submitting ? 'Allocating Stores...' : 'Finalize & Deploy Equipment Set'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* CREATE TASK MODAL */}
      {showCreateModal && (
        <div className="modal fade show d-block" style={{ background: 'rgba(0,0,0,0.6)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content glass-panel p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold text-success">Plan Combat Engineer Task</h5>
                <button type="button" className="btn-close" onClick={() => setShowCreateModal(false)}></button>
              </div>
              <form onSubmit={handleCreateTask}>
                <div className="modal-body py-3">
                  <div className="mb-3">
                    <label className="form-label text-muted fw-semibold">Operation / Task Name</label>
                    <input
                      type="text"
                      required
                      className="form-control glass-input"
                      placeholder="e.g. SOLANI CROSSING LAUNCH"
                      value={newTaskForm.name}
                      onChange={(e) => setNewTaskForm({ ...newTaskForm, name: e.target.value })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-muted fw-semibold">Operational Description</label>
                    <textarea
                      className="form-control glass-input"
                      rows="2"
                      placeholder="Describe target goals..."
                      value={newTaskForm.description}
                      onChange={(e) => setNewTaskForm({ ...newTaskForm, description: e.target.value })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label text-muted fw-semibold">Required Equipment Set</label>
                    <select
                      required
                      className="form-select glass-input"
                      value={newTaskForm.requiredEquipmentSet}
                      onChange={(e) => setNewTaskForm({ ...newTaskForm, requiredEquipmentSet: e.target.value })}
                    >
                      <option value="">Select Equipment Set Template</option>
                      {equipmentSets.map(s => (
                        <option key={s._id} value={s._id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  {isMaster && (
                    <div className="mb-3">
                      <label className="form-label text-muted fw-semibold">Assigned Training Battalion / Unit</label>
                      <select
                        required
                        className="form-select glass-input"
                        value={newTaskForm.assignedEstablishment}
                        onChange={(e) => setNewTaskForm({ ...newTaskForm, assignedEstablishment: e.target.value })}
                      >
                        <option value="">Select Holding Establishment</option>
                        {establishments.map(e => (
                          <option key={e._id} value={e._id}>{e.establishmentName}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="row g-2">
                    <div className="col-md-6">
                      <label className="form-label text-muted fw-semibold">Start Date</label>
                      <input
                        type="date"
                        required
                        className="form-control glass-input"
                        value={newTaskForm.startDate}
                        onChange={(e) => setNewTaskForm({ ...newTaskForm, startDate: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label text-muted fw-semibold">End Date</label>
                      <input
                        type="date"
                        required
                        className="form-control glass-input"
                        value={newTaskForm.endDate}
                        onChange={(e) => setNewTaskForm({ ...newTaskForm, endDate: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setShowCreateModal(false)}>Cancel</button>
                  <button type="submit" disabled={submitting} className="btn btn-primary-farm rounded-pill px-4">
                    {submitting ? 'Planning...' : 'Plan Task'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TaskPlanner;
