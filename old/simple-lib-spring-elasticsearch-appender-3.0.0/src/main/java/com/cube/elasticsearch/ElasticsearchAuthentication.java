package com.cube.elasticsearch;

import java.net.HttpURLConnection;

public interface ElasticsearchAuthentication {
    void addAuth(HttpURLConnection urlConnection, String body);
}
