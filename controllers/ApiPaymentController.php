<?php
class ApiPaymentController {

    public function createPreference() {
        $userId = Auth::getUserId();
        if (!$userId) Response::error('No autenticado', 401);
        if (Auth::getUserRole() !== 'lawyer') Response::error('Solo abogados', 403);

        $input = json_decode(file_get_contents('php://input'), true);
        $plan = $input['plan'] ?? 'premium';

        $prices = ['premium' => 15.00, 'pro' => 30.00, 'estudio' => 50.00];
        if (!isset($prices[$plan])) Response::error('Plan no válido');

        $amount = $prices[$plan];

        $mpUrl = 'https://api.mercadopago.com/checkout/preferences';
        $data = [
            'items' => [
                [
                    'title' => "Suscripción BogaYA - Plan " . ucfirst($plan),
                    'quantity' => 1,
                    'currency_id' => 'ARS',
                    'unit_price' => $amount
                ]
            ],
            'back_urls' => [
                'success' => BASE_URL . '/dashboard?payment=success',
                'failure' => BASE_URL . '/dashboard?payment=failure',
                'pending' => BASE_URL . '/dashboard?payment=pending'
            ],
            'notification_url' => MP_WEBHOOK_URL,
            'external_reference' => $userId . '-' . $plan . '-' . time(),
            'auto_return' => 'approved'
        ];

        $ch = curl_init($mpUrl);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Authorization: Bearer ' . MP_ACCESS_TOKEN,
            'Content-Type: application/json'
        ]);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $response = curl_exec($ch);
        curl_close($ch);

        $result = json_decode($response, true);
        if (isset($result['id'])) {
            $db = Database::getInstance()->getConnection();
            $stmt = $db->prepare("INSERT INTO payments (user_id, mp_preference_id, plan, amount, status, created_at) 
                                  VALUES (?, ?, ?, ?, 'pending', NOW())");
            $stmt->execute([$userId, $result['id'], $plan, $amount]);

            Response::success(['preference_id' => $result['id'], 'init_point' => $result['init_point']]);
        } else {
            Response::error('Error al crear preferencia de pago: ' . json_encode($result), 500);
        }
    }

    public function webhook() {
        $input = json_decode(file_get_contents('php://input'), true);
        if ($input['type'] !== 'payment') {
            http_response_code(200);
            echo 'OK';
            exit;
        }

        $paymentId = $input['data']['id'];
        $mpUrl = "https://api.mercadopago.com/v1/payments/{$paymentId}";
        $ch = curl_init($mpUrl);
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . MP_ACCESS_TOKEN]);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        $response = curl_exec($ch);
        curl_close($ch);
        $payment = json_decode($response, true);

        if ($payment['status'] === 'approved') {
            $externalRef = $payment['external_reference'];
            list($userId, $plan, $timestamp) = explode('-', $externalRef);

            $db = Database::getInstance()->getConnection();
            $stmt = $db->prepare("UPDATE payments SET mp_payment_id = ?, status = 'paid' WHERE mp_preference_id = ?");
            $stmt->execute([$paymentId, $payment['preference_id']]);

            $expires = date('Y-m-d H:i:s', strtotime('+30 days'));
            $stmt = $db->prepare("UPDATE lawyer_profiles SET plan_type = ?, plan_expires = ? WHERE user_id = ?");
            $stmt->execute([$plan, $expires, $userId]);

            Notification::send($userId, '🎉 Suscripción activada', "Tu plan {$plan} está activo hasta el " . date('d/m/Y', strtotime($expires)));
            Notification::saveNotification($userId, 'subscription_activated', '🎉 Suscripción activada', "Tu plan {$plan} está activo hasta el " . date('d/m/Y', strtotime($expires)), '/profile');
        }

        http_response_code(200);
        echo 'OK';
        exit;
    }
}
?>