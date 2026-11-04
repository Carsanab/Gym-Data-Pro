import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { 
  gimnastasAPI, 
  categoriasAPI, 
  gruposAPI, 
  usuariosAPI,
  asistenciaAPI
} from '../services/api';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
  const { user } = useAuth();
  
  const [gimnastas, setGimnastas] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [grupos, setGrupos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const [stats, setStats] = useState({ 
    grupos: 0, 
    gimnastas: 0, 
    gimnastasActivas: 0,    // ✅ NUEVO
    gimnastasInactivas: 0,  // ✅ NUEVO
    presentesHoy: 0 
  });
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsLoaded, setStatsLoaded] = useState(false);

  const cargarDatos = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const [g, c, gr, u] = await Promise.all([
        gimnastasAPI.getAll(),
        categoriasAPI.getAll(),
        gruposAPI.getAll(),
        usuariosAPI.getAll()
      ]);
      setGimnastas(g);
      setCategorias(c.sort((a, b) => a.Idcategoria - b.Idcategoria));
      setGrupos(gr);
      setUsuarios(u);
      setLoaded(true);
    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  // ✅ CALCULAR STATS CON ACTIVAS E INACTIVAS
  const cargarStats = useCallback(async () => {
    if (statsLoading || !user) return;
    setStatsLoading(true);
    const isAdmin = user.Rol === 'Admin';

    try {
      const [gruposData, gimnastasData] = await Promise.all([
        gruposAPI.getAll(),
        gimnastasAPI.getAll()
      ]);

      let gruposFiltrados, gimnastasFiltrados;

      if (isAdmin) {
        const gruposDelAdmin = gruposData.filter(g =>
          String(g['Profesor(es)']).split(',').map(s => s.trim()).includes(user.Usuario)
        );

        if (gruposDelAdmin.length > 0) {
          gruposFiltrados = gruposDelAdmin;
          const idsGrupos = gruposDelAdmin.map(gr => String(gr.IdGrupo));
          gimnastasFiltrados = gimnastasData.filter(g => idsGrupos.includes(String(g.Grupo)));
        } else {
          gruposFiltrados = gruposData;
          gimnastasFiltrados = gimnastasData;
        }
      } else {
        gruposFiltrados = gruposData.filter(g =>
          String(g['Profesor(es)']).split(',').map(s => s.trim()).includes(user.Usuario)
        );
        const idsGrupos = gruposFiltrados.map(gr => String(gr.IdGrupo));
        gimnastasFiltrados = gimnastasData.filter(g => idsGrupos.includes(String(g.Grupo)));
      }

      // ✅ CALCULAR ACTIVAS E INACTIVAS
      const gimnastasActivas = gimnastasFiltrados.filter(g => g.Status === 'Activo').length;
      const gimnastasInactivas = gimnastasFiltrados.filter(g => g.Status === 'Inactivo').length;

      const hoy = new Date().toISOString().split('T')[0];
      let presentesHoy = 0;

      if (gruposFiltrados.length > 0) {
        const asistenciasHoy = await Promise.all(
          gruposFiltrados.map(g => asistenciaAPI.get(g.IdGrupo, hoy).catch(() => []))
        );
        presentesHoy = asistenciasHoy.flat().filter(a => a.Estado === 'P').length;
      }

      setStats({
        grupos: gruposFiltrados.length,
        gimnastas: gimnastasFiltrados.length,
        gimnastasActivas,      // ✅
        gimnastasInactivas,    // ✅
        presentesHoy
      });
      setStatsLoaded(true);
    } catch (err) {
      console.error('Error cargando stats:', err);
    } finally {
      setStatsLoading(false);
    }
  }, [user, statsLoading]);

  useEffect(() => {
    if (user && !loaded) {
      cargarDatos();
    }
  }, [user, loaded, cargarDatos]);

  useEffect(() => {
    if (user && !statsLoaded) {
      cargarStats();
    }
  }, [user, statsLoaded, cargarStats]);

  const refreshGimnastas = async () => {
    const g = await gimnastasAPI.getAll();
    setGimnastas(g);
    // Recalcular stats después de refresh
    setStatsLoaded(false);
  };

  const refreshGrupos = async () => {
    const gr = await gruposAPI.getAll();
    setGrupos(gr);
    setStatsLoaded(false);
  };

  const refreshUsuarios = async () => {
    const u = await usuariosAPI.getAll();
    setUsuarios(u);
  };

  const refreshAll = async () => {
    await cargarDatos();
    setStatsLoaded(false);
  };

  const refreshStats = async () => {
    setStatsLoaded(false);
    await cargarStats();
  };

  const clearData = () => {
    setGimnastas([]);
    setCategorias([]);
    setGrupos([]);
    setUsuarios([]);
    setLoaded(false);
    setStats({ grupos: 0, gimnastas: 0, gimnastasActivas: 0, gimnastasInactivas: 0, presentesHoy: 0 });
    setStatsLoaded(false);
  };

  return (
    <DataContext.Provider value={{
      gimnastas,
      categorias,
      grupos,
      usuarios,
      loading,
      loaded,
      stats,
      statsLoading,
      refreshGimnastas,
      refreshGrupos,
      refreshUsuarios,
      refreshAll,
      refreshStats,
      clearData
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);