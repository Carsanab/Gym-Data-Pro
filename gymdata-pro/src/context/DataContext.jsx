import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { 
  gimnastasAPI, 
  categoriasAPI, 
  gruposAPI, 
  usuariosAPI 
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

  useEffect(() => {
    if (user && !loaded) {
      cargarDatos();
    }
  }, [user, loaded, cargarDatos]);

  const refreshGimnastas = async () => {
    const g = await gimnastasAPI.getAll();
    setGimnastas(g);
  };

  const refreshGrupos = async () => {
    const gr = await gruposAPI.getAll();
    setGrupos(gr);
  };

  const refreshUsuarios = async () => {
    const u = await usuariosAPI.getAll();
    setUsuarios(u);
  };

  const refreshAll = async () => {
    await cargarDatos();
  };

  const clearData = () => {
    setGimnastas([]);
    setCategorias([]);
    setGrupos([]);
    setUsuarios([]);
    setLoaded(false);
  };

  return (
    <DataContext.Provider value={{
      gimnastas,
      categorias,
      grupos,
      usuarios,
      loading,
      loaded,
      refreshGimnastas,
      refreshGrupos,
      refreshUsuarios,
      refreshAll,
      clearData
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => useContext(DataContext);