import APIRequest from "../APIRequest";

export const getPresignedImageUrl = async (objectName, token) => {
  if (!objectName) {
    return '';
  }

  try {
    const api = new APIRequest();
    const res = await api.request(
      '/secureserver/presignedurl/generatePresignedURL',
      'GET',
      null,
      token,
      { objectName }
    );

    if (res?.success && res?.url) {
      return res.url;
    }

    return '';
  } catch (error) {
    console.log(error, 'error getting address');
    return '';
  }
};


