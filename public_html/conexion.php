<?php

$host = "localhost";
$db   = "u722310012_clubhuella";
$user = "u722310012_clubhuella";
$pass = "ClubHuella123";

try {
    $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass);
    
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);

} catch (PDOException $e) {
    die(json_encode([
        "error" => "Error conexión DB",
        "detalle" => $e->getMessage()
    ]));
}