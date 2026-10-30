const API_URL = import.meta.env.VITE_API_URL;

async function fetchAppsScript(params = {}, method = 'GET', body = null) {
  const url = new URL(API_URL);
  if (method === 'GET') {
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key]);
      }
    });
  }
  const options = { method, headers: { 'Accept': 'application/json' } };
  if (method === 'POST' && body) {
    options.headers['Content-Type'] = 'text/plain;charset=UTF-8';
    options.body = JSON.stringify(body);
  }
  const response = await fetch(url.toString(), options);
  if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
  return await response.json();
}

export const authAPI = {
  login: (email, password) => fetchAppsScript({ action: 'login', email, password }),
};

export const gimnastasAPI = {
  getAll: () => fetchAppsScript({ action: 'gimnastas' }),
  crear: (idUsuario, datos) => fetchAppsScript({}, 'POST', { action: 'crearGimnasta', idUsuario, datos }),
  actualizar: (idUsuario, id, datos) => fetchAppsScript({}, 'POST', { action: 'actualizarGimnasta', idUsuario, id, datos }),
  eliminar: (idUsuario, id) => fetchAppsScript({}, 'POST', { action: 'eliminarGimnasta', idUsuario, id }),
};

export const categoriasAPI = {
  getAll: () => fetchAppsScript({ action: 'categorias' }),
};

export const gruposAPI = {
  getAll: () => fetchAppsScript({ action: 'grupos' }),
  crear: (idUsuario, datos) => fetchAppsScript({}, 'POST', { action: 'crearGrupo', idUsuario, datos }),
  actualizar: (idUsuario, id, datos) => fetchAppsScript({}, 'POST', { action: 'actualizarGrupo', idUsuario, id, datos }),
  eliminar: (idUsuario, id) => fetchAppsScript({}, 'POST', { action: 'eliminarGrupo', idUsuario, id }),
};

export const usuariosAPI = {
  getAll: () => fetchAppsScript({ action: 'usuarios' }),
  crear: (idUsuario, datos) => fetchAppsScript({}, 'POST', { action: 'crearUsuario', idUsuario, datos }),
  actualizar: (idUsuario, id, datos) => fetchAppsScript({}, 'POST', { action: 'actualizarUsuario', idUsuario, id, datos }),
  eliminar: (idUsuario, id) => fetchAppsScript({}, 'POST', { action: 'eliminarUsuario', idUsuario, id }),
};

export const asistenciaAPI = {
  get: (idGrupo, fecha) => fetchAppsScript({ action: 'asistencia', idGrupo, fecha }),
  registrar: (registros) => fetchAppsScript({}, 'POST', { action: 'registrarAsistencia', registros }),
  editar: (id, nuevoEstado) => fetchAppsScript({}, 'POST', { action: 'editarAsistencia', id, nuevoEstado }),
  eliminar: (id) => fetchAppsScript({}, 'POST', { action: 'eliminarAsistencia', id }),
  getHistorial: (idGrupo) => fetchAppsScript({ action: 'historial', idGrupo }),
};