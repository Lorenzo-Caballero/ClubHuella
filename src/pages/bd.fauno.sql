// --------------------- CLIENTES ---------------------
if ($recurso === 'clientes') {
    switch ($metodo) {
        case 'GET':
            if ($id) {
                $res = $conexion->query("SELECT * FROM users WHERE id = $id");
                $fila = $res->fetch_assoc();
                echo json_encode($fila ?: ["message" => "Usuario no encontrado"]);
            } else {
                $res = $conexion->query("SELECT * FROM users");
                $datos = [];
                while ($fila = $res->fetch_assoc()) $datos[] = $fila;
                echo json_encode($datos);
            }
            break;

        case 'POST':
            if (isset($_GET['login'])) {
                $email = $conexion->real_escape_string($input['email']);
                $password = $input['password'];
                $res = $conexion->query("SELECT * FROM users WHERE email = '$email'");
                $usuario = $res->fetch_assoc();
                if (!$usuario || !verifyPassword($password, $usuario['password'])) {
                    echo json_encode(["message" => "Credenciales incorrectas"]);
                } else {
                    $token = generarToken(["userId" => $usuario['id'], "email" => $usuario['email']]);
                    echo json_encode([
                        "message" => "Login exitoso",
                        "email" => $usuario['email'],
                        "name" => $usuario['name'],
                        "role" => $usuario['role'] ?? null,
                        "coins" => $usuario['coins'] ?? null,
                        "token" => $token
                    ]);
                }
            } else {
                $email = $conexion->real_escape_string($input['email']);
                $res = $conexion->query("SELECT * FROM users WHERE email = '$email'");
                if ($res->num_rows > 0) {
                    echo json_encode(["error" => "Ya existe una cuenta con ese correo electrónico"]);
                    exit;
                }

                $name = $conexion->real_escape_string($input['name']);
                $password = hashPassword($input['password']);
                if ($conexion->query("INSERT INTO users (name, email, password) VALUES ('$name', '$email', '$password')")) {
                    echo json_encode([
                        "id_client" => $conexion->insert_id,
                        "name" => $name,
                        "email" => $email
                    ]);
                } else {
                    echo json_encode(["error" => "Error al registrar usuario"]);
                }
            }
            break;

        case 'PUT':
            $id = (int)$id;
            $name = $conexion->real_escape_string($input['name']);
            $email = $conexion->real_escape_string($input['email']);
            $conexion->query("UPDATE users SET name='$name', email='$email' WHERE id=$id");
            echo json_encode(["message" => "Usuario actualizado correctamente"]);
            break;

        case 'DELETE':
            $id = (int)$id;
            $conexion->query("DELETE FROM users WHERE id = $id");
            echo json_encode(["message" => "Usuario eliminado correctamente"]);
            break;

        default:
            http_response_code(405);
            echo json_encode(["error" => "Método no permitido"]);
            break;
    }
}

// --------------------- APIAI ---------------------
if ($recurso === 'apiai') {
    switch ($metodo) {
        case 'GET':
            if ($id) {
                $res = $conexion->query("SELECT ia FROM apiai WHERE id = $id");
                $fila = $res->fetch_assoc();
                echo json_encode($fila ?: ["message" => "Registro no encontrado"]);
            } else {
                $res = $conexion->query("SELECT ia FROM apiai");
                $datos = [];
                while ($fila = $res->fetch_assoc()) $datos[] = $fila;
                echo json_encode($datos);
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(["error" => "Método no permitido"]);
            break;
    }
}

// --------------------- PREMIOS ---------------------
if ($recurso === 'premios') {
    switch ($metodo) {
        case 'GET':
            if (isset($_GET['ip'])) {
                $ip = $conexion->real_escape_string($_GET['ip']);
                $res = $conexion->query("SELECT * FROM premios WHERE ip = '$ip' ORDER BY date DESC LIMIT 1");
                $fila = $res->fetch_assoc();
                echo json_encode($fila ?: ["message" => "Sin jugadas"]);
            } else if ($id) {
                $res = $conexion->query("SELECT * FROM premios WHERE id = '$id'");
                $fila = $res->fetch_assoc();
                echo json_encode($fila ?: ["message" => "Premio no encontrado"]);
            } else {
                $res = $conexion->query("SELECT * FROM premios");
                $datos = [];
                while ($fila = $res->fetch_assoc()) $datos[] = $fila;
                echo json_encode($datos);
            }
            break;

        case 'POST':
            if (!isset($input['uuid'], $input['premio'], $input['ip'])) {
                echo json_encode(["error" => "Faltan campos requeridos"]);
                exit;
            }

            $uuid = $conexion->real_escape_string($input['uuid']);
            $premio = $conexion->real_escape_string($input['premio']);
            $ip = $conexion->real_escape_string($input['ip']);
            $date = isset($input['date']) 
                ? $conexion->real_escape_string($input['date']) 
                : date('Y-m-d H:i:s');

            $query = "INSERT INTO premios (uuid, premio, date, ip) VALUES ('$uuid', '$premio', '$date', '$ip')";
            if ($conexion->query($query)) {
                echo json_encode(["message" => "Premio registrado correctamente"]);
            } else {
                echo json_encode(["error" => $conexion->error]);
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(["error" => "Método no permitido"]);
            break;
    }
}
