package com.example.web.controller;


import com.example.web.controller.request.UserJoinRequest;
import com.example.web.controller.request.UserLoginRequest;
import com.example.web.controller.response.UserJoinResponse;
import com.example.web.controller.response.UserLoginResponse;
import com.example.web.service.UserService;
import com.example.web.util.JwtTokenUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import javax.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequiredArgsConstructor
@CrossOrigin("*")
public class UserController {
    @Value("${file.upload-dir}")
    private String uploadDir;

    private final UserService userService;
    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.token.expired-time-ms}")
    private Long expiredTimeMs;

    @PostMapping("/user/join")
    public ResponseEntity<Object> join(@RequestBody UserJoinRequest request) {
        return ResponseEntity.ok().body(UserJoinResponse.fromUser(userService.join(request)));

    }

    @PostMapping("/user/login")
    public ResponseEntity<Object> login(@RequestBody UserLoginRequest request) {
        UserLoginResponse result = userService.login(request);

        String token = JwtTokenUtils.generateAccessToken(result.getId(), result.getUserName(), secretKey, expiredTimeMs);
        String cookie = String.format("ATOKEN=%s; HttpOnly; Secure; Domain=localhost; Path=/; Max-Age=%d", token, 600000);



        return ResponseEntity.ok().header("Set-Cookie",cookie).body(result);
    }

    @GetMapping("/user/profile")
    public ResponseEntity<Object> profile(@AuthenticationPrincipal UserDetails authentication) {
        System.out.println(authentication.getUsername());
        return ResponseEntity.ok().body(authentication.getUsername());
    }

    @PostMapping("/user/check-email")
    public ResponseEntity<Object> checkEmail(@RequestBody Map<String, String> request) {
        String email = request.get("email");

        if (email == null || email.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "이메일을 입력해주세요."));
        }

        boolean exists = userService.checkEmail(email);

        return ResponseEntity.ok(Map.of("exists", exists));
    }


    // 이미지를 다운로드 받도록 하는 엔드포인트
    @GetMapping("/display/{filename}")
    public ResponseEntity<Resource> downloadImage(@PathVariable String filename) {
        try {
            // static/uploads 폴더에서 이미지 경로
            Path imagePath = Paths.get(uploadDir).resolve(filename);

            // 파일 리소스를 로드
            Resource resource = new UrlResource(imagePath.toUri());
            

            // 파일이 존재하고 읽을 수 있는지 확인
            if (resource.exists() || resource.isReadable()) {
                // 이미지 다운로드 응답
                return ResponseEntity.ok()
                        .contentType(MediaType.IMAGE_JPEG)  // 이미지 형식 설정 (예: JPG)
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();  // 파일을 찾을 수 없는 경우 404 응답
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();  // 오류 발생 시 500 응답
        }
    }

    @PostMapping("/upload-image")
    public ResponseEntity<Map<String, String>> uploadImage(@RequestParam("image") MultipartFile file) {
        try {
            // 이미지 저장 처리 (예: 파일 시스템에 저장)
            String imageUrl = saveImage(file);

            // 성공 응답
            Map<String, String> response = new HashMap<>();
            response.put("success", "true");
            response.put("imageUrl", imageUrl);
            return ResponseEntity.ok(response);

        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("success", "false"));
        }
    }

    private String saveImage(MultipartFile file) throws IOException {
        // 파일 저장 로직 구현 (예: 로컬 파일 시스템 또는 클라우드 스토리지)
        String fileName = System.currentTimeMillis() + "-" + file.getOriginalFilename();
        Path dirPath = Paths.get(uploadDir);
        Files.createDirectories(dirPath); // 폴더 없으면 생성

        Path target = dirPath.resolve(fileName).normalize();
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        // 이미지 URL 반환 (이 예시에서는 로컬 서버 경로)
        return "/display/" + fileName;
    }


    // 이미지를 다운로드 받도록 하는 엔드포인트
    @GetMapping("/json/**")
    public ResponseEntity<Resource> downloadJson(HttpServletRequest request) {
        try {

            String uri = request.getRequestURI();
            String ctx = request.getContextPath();

            String path = uri.substring(ctx.length());
            if (path.startsWith("/")) {
                path = path.substring(1);
            }
            Path imagePath = Paths.get("static").resolve(path+".json");

            Resource resource = new ClassPathResource(imagePath.toString());

            if (resource.exists() || resource.isReadable()) {
                return ResponseEntity.ok()
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }

}
