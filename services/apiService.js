import supabaseClient from "../utils/supabaseClient.js";

const ApiService = {
  fetchData(param) {
    return new Promise((resolve, reject) => {
      BaseService(param)
        .then((response) => {
          resolve(response);
        })
        .catch((errors) => {
          reject(errors);
        });
    });
  },
};

export async function sbUpload(bucket, imagepath, image) {
  const { data, error } = await supabaseClient.storage
    .from(bucket)
    .upload(imagepath, image, {
      upsert: true,
    });

  if (error) {
    return error;
  }
  if (data) {
    const {
      data: { publicUrl },
      error,
    } = await supabaseClient.storage.from(bucket).getPublicUrl(imagepath);
    const publicURL = publicUrl;

    return { error, publicURL };
  }
}

export async function sbUpdate(table, updateData, type, authId) {
  const { data, error } = await supabaseClient
    .from(table)
    .update(updateData)
    .eq(type, authId)
    .select();

  return { error, data };
}

export async function checkDetails(user, type, query, table) {
  const { data, error } = await supabaseClient
    .from(table)
    .select(query)
    .eq(type, user)
    .single();

  if (error) return error;
  else return data;
}

export async function sbInsert(table, insertData) {
  const { data, error } = await supabaseClient
    .from(table)
    .insert(insertData)
    .select();

  return { error, data };
}

export async function sbSelect(table, content, type, authId, inPage, fnPage) {
  const { data, error } = await supabaseClient
    .from(table)
    .select(content)
    .eq(type, authId)
    .range(inPage, fnPage)
    .order("created_at", { ascending: false });

  return { error, data };
}

export async function sbSelectDefault(table, content, type, authId) {
  const { data, error } = await supabaseClient
    .from(table)
    .select(content)
    .eq(type, authId);

  return { error, data };
}

export async function sbStorageDelete(bucket, deleteData) {
  const { data, error } = await supabaseClient.storage
    .from(bucket)
    .remove(deleteData);

  return { error, data };
}

export async function sbDelete(table, id) {
  const { data, error } = await supabaseClient
    .from(table)
    .delete()
    .eq("id", id)
    .select();

  return { error, data };
}

export async function sbUserDataDelete(table, type, authId, type2, authId2) {
  const { data, error } = await supabaseClient
    .from(table)
    .delete()
    .eq(type, authId)
    .eq(type2, authId2)
    .select();

  return { error, data };
}

export default ApiService;
