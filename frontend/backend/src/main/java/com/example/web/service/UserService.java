package com.example.web.service;


import com.example.web.controller.request.UserJoinRequest;
import com.example.web.controller.request.UserLoginRequest;
import com.example.web.controller.response.UserLoginResponse;
import com.example.web.exception.ErrorCode;
import com.example.web.exception.SimpleException;
import com.example.web.model.User;
import com.example.web.model.entity.UserEntity;
import com.example.web.repository.UserEntityRepository;
import com.example.web.util.JwtTokenUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserEntityRepository userRepository;
    private final BCryptPasswordEncoder encoder;

    @Value("${jwt.secret}")
    private String secretKey;

    @Value("${jwt.token.expired-time-ms}")
    private Long expiredTimeMs;


    public String profile(String token) {
        token = token.split(" ")[1];
        return JwtTokenUtils.getUsername(token, secretKey);
    }

    public User loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepository.findByEmail(email).map(User::fromEntity).orElseThrow(
                () -> new SimpleException(ErrorCode.USER_NOT_FOUND, String.format("email is %s", email))
        );
    }

    public UserLoginResponse login(UserLoginRequest request) {
        User savedUser = loadUserByUsername(request.getEmail());

        if (!encoder.matches(request.getPassword(), savedUser.getPassword())) {
            throw new SimpleException(ErrorCode.INVALID_PASSWORD);
        }

        UserLoginResponse res = new UserLoginResponse(savedUser.getId(), savedUser.getEmail(), savedUser.getUsername());
        return res;
    }


    @Transactional
    public User join(UserJoinRequest request) {
        // check the userId not exist
        userRepository.findByEmail(request.getEmail()).ifPresent(it -> {
            throw new SimpleException(ErrorCode.DUPLICATED_USER_NAME, String.format("email is %s", request.getEmail()));
        });

        UserEntity savedUser = userRepository.save(UserEntity.of(request.getEmail(), request.getName(), encoder.encode(request.getPassword())));
        return User.fromEntity(savedUser);
    }

    public boolean checkEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new IllegalArgumentException("이메일을 입력해주세요.");
        }

        return userRepository.existsByEmail(email);
    }


}

